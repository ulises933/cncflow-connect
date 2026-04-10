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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Users, Shield, Settings, UserCog, Plus, Trash2, Tag, Pencil, Key, Mail } from "lucide-react";

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
  const { isAdmin, user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});
  const [selectedRole, setSelectedRole] = useState<string>("usuario");
  const [loading, setLoading] = useState(true);
  const [rolesCatalog, setRolesCatalog] = useState<RoleCatalog[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [addRoleOpen, setAddRoleOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserNombre, setNewUserNombre] = useState("");
  const [newUserRole, setNewUserRole] = useState("usuario");
  const [creatingUser, setCreatingUser] = useState(false);

  // Edit user state
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  // Delete user state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);

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
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole } as any);
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

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserNombre) {
      toast({ title: "Error", description: "Todos los campos son requeridos", variant: "destructive" });
      return;
    }
    setCreatingUser(true);
    try {
      const response = await supabase.functions.invoke("create-user", {
        body: { email: newUserEmail, password: newUserPassword, nombre: newUserNombre, role: newUserRole },
      });
      if (response.error || response.data?.error) {
        toast({ title: "Error", description: response.data?.error || response.error?.message, variant: "destructive" });
      } else {
        toast({ title: "Usuario creado", description: `${newUserNombre} (${newUserEmail}) creado exitosamente` });
        setNewUserEmail("");
        setNewUserPassword("");
        setNewUserNombre("");
        setNewUserRole("usuario");
        setAddUserOpen(false);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setCreatingUser(false);
  };

  const handleOpenEdit = (user: UserProfile) => {
    setEditingUser(user);
    setEditNombre(user.nombre);
    setEditEmail(user.email || "");
    setEditPassword("");
    setEditUserOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    try {
      const body: any = { action: "update", user_id: editingUser.id };
      if (editNombre && editNombre !== editingUser.nombre) body.nombre = editNombre;
      if (editEmail && editEmail !== editingUser.email) body.email = editEmail;
      if (editPassword) body.password = editPassword;

      if (!body.nombre && !body.email && !body.password) {
        toast({ title: "Sin cambios", description: "No se detectaron cambios" });
        setSavingUser(false);
        return;
      }

      const response = await supabase.functions.invoke("manage-user", { body });
      if (response.error || response.data?.error) {
        toast({ title: "Error", description: response.data?.error || response.error?.message, variant: "destructive" });
      } else {
        toast({ title: "Usuario actualizado" });
        setEditUserOpen(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSavingUser(false);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeletingInProgress(true);
    try {
      const response = await supabase.functions.invoke("manage-user", {
        body: { action: "delete", user_id: deletingUser.id },
      });
      if (response.error || response.data?.error) {
        toast({ title: "Error", description: response.data?.error || response.error?.message, variant: "destructive" });
      } else {
        toast({ title: "Usuario eliminado", description: `${deletingUser.nombre} fue eliminado` });
        setDeleteConfirmOpen(false);
        setDeletingUser(null);
        fetchUsers();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setDeletingInProgress(false);
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    const slug = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    
    const { error } = await supabase.from("roles").insert({ nombre: slug, descripcion: newRoleDesc || null } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

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
              <div className="flex items-center justify-between">
                <CardTitle>Gestión de Usuarios</CardTitle>
                <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Usuario</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crear Usuario</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Nombre completo</Label>
                        <Input value={newUserNombre} onChange={e => setNewUserNombre(e.target.value)} placeholder="Juan Pérez" />
                      </div>
                      <div className="space-y-2">
                        <Label>Correo electrónico</Label>
                        <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="usuario@empresa.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allRoleNames.map(r => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r] || r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleCreateUser} className="w-full" disabled={creatingUser}>
                        {creatingUser ? "Creando..." : "Crear Usuario"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(user)} title="Editar usuario">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setDeletingUser(user); setDeleteConfirmOpen(true); }}
                            disabled={user.id === currentUser?.id}
                            title={user.id === currentUser?.id ? "No puedes eliminarte" : "Eliminar usuario"}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Nombre</Label>
              <Input value={editNombre} onChange={e => setEditNombre(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Correo electrónico</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="correo@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> Nueva contraseña</Label>
              <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" />
              <p className="text-xs text-muted-foreground">Solo llena este campo si deseas cambiar la contraseña.</p>
            </div>
            <Button onClick={handleSaveUser} className="w-full" disabled={savingUser}>
              {savingUser ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar permanentemente a <strong>{deletingUser?.nombre}</strong> ({deletingUser?.email}). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingInProgress}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={deletingInProgress} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingInProgress ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Usuarios;
