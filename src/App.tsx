import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Cotizaciones from "./pages/Cotizaciones";
import Ventas from "./pages/Ventas";
import Clientes from "./pages/Clientes";
import BOM from "./pages/BOM";
import Compras from "./pages/Compras";
import Produccion from "./pages/Produccion";
import Maquinas from "./pages/Maquinas";
import OperadorView from "./pages/OperadorView";
import Calidad from "./pages/Calidad";
import Mantenimiento from "./pages/Mantenimiento";
import Inventario from "./pages/Inventario";
import Gastos from "./pages/Gastos";
import Metrologia from "./pages/Metrologia";
import NotFound from "./pages/NotFound";

// RH pages
import RHEmpleados from "./pages/rh/RHEmpleados";
import RHIncapacidades from "./pages/rh/RHIncapacidades";
import RHTiempoExtra from "./pages/rh/RHTiempoExtra";
import RHFaltas from "./pages/rh/RHFaltas";
import RHVacaciones from "./pages/rh/RHVacaciones";
import RHDescuentos from "./pages/rh/RHDescuentos";
import RHPrestamos from "./pages/rh/RHPrestamos";
import RHPagos from "./pages/rh/RHPagos";
import RHEstadoCuenta from "./pages/rh/RHEstadoCuenta";
import RHCatalogos from "./pages/rh/RHCatalogos";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="cotizaciones" element={<Cotizaciones />} />
            <Route path="ventas" element={<Ventas />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="bom" element={<BOM />} />
            <Route path="compras" element={<Compras />} />
            <Route path="produccion" element={<Produccion />} />
            <Route path="maquinas" element={<Maquinas />} />
            <Route path="calidad" element={<Calidad />} />
            <Route path="mantenimiento" element={<Mantenimiento />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="metrologia" element={<Metrologia />} />
            {/* RH routes */}
            <Route path="rrhh/empleados" element={<RHEmpleados />} />
            <Route path="rrhh/incapacidades" element={<RHIncapacidades />} />
            <Route path="rrhh/tiempo-extra" element={<RHTiempoExtra />} />
            <Route path="rrhh/faltas" element={<RHFaltas />} />
            <Route path="rrhh/vacaciones" element={<RHVacaciones />} />
            <Route path="rrhh/descuentos" element={<RHDescuentos />} />
            <Route path="rrhh/prestamos" element={<RHPrestamos />} />
            <Route path="rrhh/pagos" element={<RHPagos />} />
            <Route path="rrhh/estado-cuenta" element={<RHEstadoCuenta />} />
            <Route path="rrhh/catalogos" element={<RHCatalogos />} />
          </Route>
          <Route path="/operador" element={<OperadorView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
