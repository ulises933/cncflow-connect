import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Package, ShoppingCart,
  Factory, Cpu, ClipboardCheck, Wrench, Warehouse,
  DollarSign, X, Monitor, Ruler, HandCoins,
  UserCog, Clock, CalendarOff, Palmtree, BadgeMinus,
  Banknote, CreditCard, FileBarChart, BookOpen, Truck, Receipt, LogOut, Shield
} from "lucide-react";
import logoProStaff from "@/assets/prostaffse-logo.png.asset.json";
import { useAuth } from "@/contexts/AuthContext";

const navGroups = [
  {
    label: "COMERCIAL",
    moduleKeys: ["dashboard", "clientes", "cotizaciones", "ventas", "entregas", "cuentas-por-cobrar"],
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard", moduleKey: "dashboard" },
      { to: "/clientes", icon: Users, label: "Clientes", moduleKey: "clientes" },
      { to: "/cotizaciones", icon: FileText, label: "Cotizaciones", moduleKey: "cotizaciones" },
      { to: "/ventas", icon: HandCoins, label: "Ventas", moduleKey: "ventas" },
      { to: "/entregas", icon: Truck, label: "Entregas", moduleKey: "entregas" },
      { to: "/cuentas-por-cobrar", icon: FileBarChart, label: "Cuentas x Cobrar", moduleKey: "cuentas-por-cobrar" },
    ],
  },
  {
    label: "PRODUCCIÓN",
    moduleKeys: ["produccion", "bom", "maquinas"],
    items: [
      { to: "/produccion", icon: Factory, label: "Órdenes", moduleKey: "produccion" },
      { to: "/bom", icon: Package, label: "BOM", moduleKey: "bom" },
      { to: "/maquinas", icon: Cpu, label: "Máquinas", moduleKey: "maquinas" },
    ],
  },
  {
    label: "OPERACIONES",
    moduleKeys: ["compras", "proveedores", "cuentas-por-pagar", "inventario", "calidad", "metrologia"],
    items: [
      { to: "/compras", icon: ShoppingCart, label: "Compras", moduleKey: "compras" },
      { to: "/proveedores", icon: Truck, label: "Proveedores", moduleKey: "proveedores" },
      { to: "/cuentas-por-pagar", icon: Receipt, label: "Cuentas x Pagar", moduleKey: "cuentas-por-pagar" },
      { to: "/inventario", icon: Warehouse, label: "Inventario", moduleKey: "inventario" },
      { to: "/calidad", icon: ClipboardCheck, label: "Calidad", moduleKey: "calidad" },
      { to: "/metrologia", icon: Ruler, label: "Metrología", moduleKey: "metrologia" },
    ],
  },
  {
    label: "RECURSOS HUMANOS",
    moduleKeys: ["rrhh"],
    items: [
      { to: "/rrhh/empleados", icon: UserCog, label: "Empleados", moduleKey: "rrhh" },
      { to: "/rrhh/incapacidades", icon: CalendarOff, label: "Incapacidades", moduleKey: "rrhh" },
      { to: "/rrhh/tiempo-extra", icon: Clock, label: "Tiempo Extra", moduleKey: "rrhh" },
      { to: "/rrhh/faltas", icon: BadgeMinus, label: "Faltas", moduleKey: "rrhh" },
      { to: "/rrhh/vacaciones", icon: Palmtree, label: "Vacaciones", moduleKey: "rrhh" },
      { to: "/rrhh/descuentos", icon: BadgeMinus, label: "Descuentos", moduleKey: "rrhh" },
      { to: "/rrhh/prestamos", icon: Banknote, label: "Préstamos", moduleKey: "rrhh" },
      { to: "/rrhh/pagos", icon: CreditCard, label: "Pagos", moduleKey: "rrhh" },
      { to: "/rrhh/estado-cuenta", icon: FileBarChart, label: "Estado de Cuenta", moduleKey: "rrhh" },
      { to: "/rrhh/catalogos", icon: BookOpen, label: "Catálogos", moduleKey: "rrhh" },
    ],
  },
  {
    label: "GESTIÓN",
    moduleKeys: ["mantenimiento", "gastos", "operador", "usuarios"],
    items: [
      { to: "/mantenimiento", icon: Wrench, label: "Mantenimiento", moduleKey: "mantenimiento" },
      { to: "/gastos", icon: DollarSign, label: "Gastos", moduleKey: "gastos" },
      { to: "/operador", icon: Monitor, label: "Vista Operador", moduleKey: "operador" },
      { to: "/usuarios", icon: Shield, label: "Usuarios y Permisos", moduleKey: "usuarios" },
    ],
  },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
  const { profile, allowedModules, signOut, isAdmin } = useAuth();

  const canAccess = (moduleKey: string) => {
    if (isAdmin) return true;
    return allowedModules.includes(moduleKey);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="h-16 border-b border-sidebar-border flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <img src={logoMrisa} alt="MRISA de C.V." className="h-8 object-contain" />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-lg text-sidebar-foreground tracking-tight">MRISA</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-sidebar-foreground/50">de C.V.</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-5">
          {navGroups.map((group) => {
            const visibleItems = group.items.filter(item => canAccess(item.moduleKey));
            if (visibleItems.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="text-[10px] font-medium text-sidebar-foreground/40 mb-2 px-3 tracking-[0.18em]">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all ${
                          isActive
                            ? "bg-sidebar-primary/15 text-sidebar-primary font-medium border-l-2 border-sidebar-primary pl-[10px]"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-primary/20 border border-sidebar-primary/30 flex items-center justify-center">
                <span className="text-xs font-semibold text-sidebar-primary">
                  {profile?.nombre?.substring(0, 2).toUpperCase() || "US"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">{profile?.nombre || "Usuario"}</p>
                <p className="text-[10px] uppercase tracking-wider text-sidebar-foreground/50">{profile?.rol || "usuario"}</p>
              </div>
            </div>
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-destructive transition-colors" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
