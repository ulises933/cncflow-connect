import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, FileText, Package, ShoppingCart,
  Factory, Cpu, ClipboardCheck, Wrench, Warehouse,
  DollarSign, X, Monitor, Ruler, HandCoins,
  UserCog, Clock, CalendarOff, Palmtree, BadgeMinus,
  Banknote, CreditCard, FileBarChart, BookOpen
} from "lucide-react";
import logoMrisa from "@/assets/logo-mrisa.png";

const navGroups = [
  {
    label: "COMERCIAL",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/clientes", icon: Users, label: "Clientes" },
      { to: "/cotizaciones", icon: FileText, label: "Cotizaciones" },
      { to: "/ventas", icon: HandCoins, label: "Ventas" },
    ],
  },
  {
    label: "PRODUCCIÓN",
    items: [
      { to: "/produccion", icon: Factory, label: "Órdenes" },
      { to: "/bom", icon: Package, label: "BOM" },
      { to: "/maquinas", icon: Cpu, label: "Máquinas" },
    ],
  },
  {
    label: "OPERACIONES",
    items: [
      { to: "/compras", icon: ShoppingCart, label: "Compras" },
      { to: "/inventario", icon: Warehouse, label: "Inventario" },
      { to: "/calidad", icon: ClipboardCheck, label: "Calidad" },
      { to: "/metrologia", icon: Ruler, label: "Metrología" },
    ],
  },
  {
    label: "RECURSOS HUMANOS",
    items: [
      { to: "/rrhh/empleados", icon: UserCog, label: "Empleados" },
      { to: "/rrhh/incapacidades", icon: CalendarOff, label: "Incapacidades" },
      { to: "/rrhh/tiempo-extra", icon: Clock, label: "Tiempo Extra" },
      { to: "/rrhh/faltas", icon: BadgeMinus, label: "Faltas" },
      { to: "/rrhh/vacaciones", icon: Palmtree, label: "Vacaciones" },
      { to: "/rrhh/descuentos", icon: BadgeMinus, label: "Descuentos" },
      { to: "/rrhh/prestamos", icon: Banknote, label: "Préstamos" },
      { to: "/rrhh/pagos", icon: CreditCard, label: "Pagos" },
      { to: "/rrhh/estado-cuenta", icon: FileBarChart, label: "Estado de Cuenta" },
      { to: "/rrhh/catalogos", icon: BookOpen, label: "Catálogos" },
    ],
  },
  {
    label: "GESTIÓN",
    items: [
      { to: "/mantenimiento", icon: Wrench, label: "Mantenimiento" },
      { to: "/gastos", icon: DollarSign, label: "Gastos" },
    ],
  },
  {
    label: "OPERADOR",
    items: [
      { to: "/operador", icon: Monitor, label: "Vista Operador" },
    ],
  },
];

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

const AppSidebar = ({ open, onClose }: AppSidebarProps) => {
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
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          flex flex-col
        `}
      >
        <div className="h-14 border-b border-border flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <img src={logoMrisa} alt="MRISA de C.V." className="h-8 object-contain" />
            <span className="font-bold text-foreground tracking-tight text-sm">MRISA de C.V.</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 px-3 tracking-widest">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">AD</span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">Administrador</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
