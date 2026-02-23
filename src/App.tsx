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
import RecursosHumanos from "./pages/RecursosHumanos";
import Gastos from "./pages/Gastos";
import Metrologia from "./pages/Metrologia";
import NotFound from "./pages/NotFound";

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
            <Route path="rrhh" element={<RecursosHumanos />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="metrologia" element={<Metrologia />} />
          </Route>
          <Route path="/operador" element={<OperadorView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
