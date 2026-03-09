import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Settings, UserCog } from "lucide-react";

const ROLES = ["admin", "usuario", "operador", "supervisor"] as const;
type AppRole = typeof ROLES[number];

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  usuario: "Usuario",
  operador: "Operador",
  supervisor: "Supervisor",
};

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

const Usuarios = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRole, setSelectedRole] = useState<AppRole>("usuario");
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    // Remove existing roles
    await supabase.from("user_roles").delete().eq("user_id", userId);
    // Insert new role
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    // Update profile
    await supabase.from("profiles").update({ rol: newRole }).eq("id", userId);
    toast({ title: "Rol actualizado" });
    fetchUsers();
  };

  const handleToggleActive = async (userId: string, activo: boolean) => {
    await supabase.from("profiles").update({ activo }).eq("id", userId);
    toast({ title: activo ? "Usuario activado" : "Usuario desactivado" });
    fetchUsers();
  };

  const handlePermissionToggle = async (role: AppRole, moduleKey: string, currentValue: boolean) => {
    const newValue = !currentValue;
    
    // Upsert permission
    const { error } = await supabase.from("module_permissions").upsert(
      { role, module_key: moduleKey, can_access: newValue },
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
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{users.filter(u => u.activo).length}</p>
                <p className="text-sm text-muted-foreground">Usuarios Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
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
                            onValueChange={(v) => handleRoleChange(user.id, v as AppRole)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => (
                                <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
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

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Permisos de Módulos</CardTitle>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
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
