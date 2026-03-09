import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Settings, UserCog, Plus, Trash2, Tag } from "lucide-react";

const MODULE_GROUPS = [
  {
    label: "COMERCIAL",
    modules: [
      { key: "dashboard", label: "Dashboard" },
      { key: "clientes", label: "Clientes" },
      { key: "cotizaciones", label: "Cotizaciones" },
      { key: "ventas", label: "Ventas" },
      { key: "entregas", label: "Entregas" },
      { key: "cuentas-por-cobrar", label: "Cuentas x Cobrar" },
    ],
  },
  {
    label: "PRODUCCIÓN",
    modules: [
      { key: "produccion", label: "Órdenes" },
      { key: "bom", label: "BOM" },
      { key: "maquinas", label: "Máquinas" },
    ],
  },
  {
    label: "OPERACIONES",
    modules: [
      { key: "compras", label: "Compras" },
      { key: "proveedores", label: "Proveedores" },
      { key: "cuentas-por-pagar", label: "Cuentas x Pagar" },
      { key: "inventario", label: "Inventario" },
      { key: "calidad", label: "Calidad" },
      { key: "metrologia", label: "Metrología" },
    ],
  },
  {
    label: "GESTIÓN",
    modules: [
      { key: "mantenimiento", label: "Mantenimiento" },
      { key: "gastos", label: "Gastos" },
      { key: "rrhh", label: "Recursos Humanos" },
      { key: "operador", label: "Vista Operador" },
      { key: "usuarios", label: "Usuarios y Permisos" },
    ],
  },
];

interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  roles: string[];
}

interface RoleCatalog {
  id: string;
  nombre: string;
  descripcion: string | null;
}

const Usuarios = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRole, setSelectedRole] = useState<string>("usuario");
  const [loading, setLoading] = useState(true);
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalog[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [addRoleOpen, setAddRoleOpen] = useState(false);

  const fetchRoles = async () => {
    const { data } = await supabase.from("roles").select("*").order("created_at");
    if (data) setRolesCatalog(data as any);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    
    if (profiles) {
      const usersWithRoles = profiles.map((p: any) => ({
        ...p,
        roles: roles?.filter((r: any) => r.user_id === p.id).map((r: any) => r.role) || [],
      }));
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  const fetchPermissions = async () => {
    const { data } = await supabase.from("module_permissions").select("*");
    if (data) {
      const perms: Record<string, Record<string, boolean>> = {};
      data.forEach((p: any) => {
        if (!perms[p.role]) perms[p.role] = {};
        perms[p.role][p.module_key] = p.can_access;
      });
      setPermissions(perms);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPermissions();
    fetchRoles();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    await supabase.from("profiles").update({ rol: newRole }).eq("id", userId);
    toast({ title: "Rol actualizado" });
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, activo: boolean) => {
    await supabase.from("profiles").update({ activo }).eq("id", userId);
    toast({ title: activo ? "Usuario activado" : "Usuario desactivado" });
    fetchUsers();
  };

  const handlePermissionToggle = async (role: string, moduleKey: string, currentValue: boolean) => {
    const newValue = !currentValue;
    const { error } = await supabase.from("module_permissions").upsert(
      { role: role as any, module_key: moduleKey, can_access: newValue },
      { onConflict: "role,module_key" }
    );
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setPermissions(prev => ({
        ...prev,
        [role]: { ...prev[role], [moduleKey]: newValue },
      }));
      toast({ title: "Permiso actualizado" });
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const slug = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    
    // Add to roles catalog
    const { error } = await supabase.from("roles").insert({ nombre: slug, descripcion: newRoleDesc || null } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Add to enum (needed for user_roles & module_permissions)
    // Since we can't alter enum from client, we use the catalog for display
    // The enum values admin/usuario/operador/supervisor still work, new roles use catalog only
    
    toast({ title: "Rol creado", description: `Rol "${slug}" agregado exitosamente` });
    setNewRoleName("");
    setNewRoleDesc("");
    setAddRoleOpen(false);
    fetchRoles();
  };

  const handleDeleteRole = async (role: RoleCatalog) => {
    if (["admin", "usuario", "operador", "supervisor"].includes(role.nombre)) {
      toast({ title: "No permitido", description: "No se pueden eliminar roles del sistema", variant: "destructive" });
      return;
    }
    await supabase.from("roles").delete().eq("id", role.id);
    toast({ title: "Rol eliminado" });
    fetchRoles();
  };

  const roleLabels = rolesCatalog.reduce((acc, r) => {
    acc[r.nombre] = r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1).replace(/_/g, " ");
    return acc;
  }, {} as Record<string, string>);

  // Fallback labels for enum roles
  const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    usuario: "Usuario",
    operador: "Operador",
    supervisor: "Supervisor",
    ...roleLabels,
  };

  const allRoleNames = rolesCatalog.map(r => r.nombre);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h2 className="text-xl font-bold text-foreground">Acceso Denegado</h2>
          <p className="text-muted-foreground mt-2">Solo los administradores pueden acceder a este módulo.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <UserCog className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Permisos</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{users.length}</p>
                <p className="text-sm text-muted-foreground">Total Usuarios</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.roles.includes("admin")).length}</p>
                <p className="text-sm text-muted-foreground">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{rolesCatalog.length}</p>
                <p className="text-sm text-muted-foreground">Roles Definidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permisos por Rol</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nombre}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {user.roles.map(r => (
                            <Badge key={r} variant={r === "admin" ? "default" : "secondary"}>
                              {ROLE_LABELS[r] || r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.activo ? "default" : "destructive"}>
                          {user.activo ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            defaultValue={user.roles[0] || "usuario"}
                            onValueChange={(v) => handleRoleChange(user.id, v)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allRoleNames.map(r => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Switch
                            checked={user.activo}
                            onCheckedChange={(v) => handleToggleActive(user.id, v)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Catálogo de Roles</CardTitle>
                <Dialog open={addRoleOpen} onOpenChange={setAddRoleOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Rol</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Agregar Rol</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Nombre del rol</Label>
                        <Input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="ej: inspector, almacenista" />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Descripción del rol" />
                      </div>
                      <Button onClick={handleAddRole} className="w-full">Crear Rol</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rol</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rolesCatalog.map(role => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <Badge variant={role.nombre === "admin" ? "default" : "secondary"}>
                          {ROLE_LABELS[role.nombre] || role.nombre}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{role.descripcion || "—"}</TableCell>
                      <TableCell>
                        {!["admin", "usuario", "operador", "supervisor"].includes(role.nombre) && (
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permisos de Módulos</CardTitle>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allRoleNames.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {MODULE_GROUPS.map(group => (
                  <div key={group.label}>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 tracking-widest">{group.label}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.modules.map(mod => {
                        const hasAccess = permissions[selectedRole]?.[mod.key] ?? false;
                        return (
                          <div
                            key={mod.key}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                          >
                            <span className="text-sm font-medium text-foreground">{mod.label}</span>
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={() => handlePermissionToggle(selectedRole, mod.key, hasAccess)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Usuarios;
