import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Factory, Package, AlertTriangle, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useOrdenesProduccion, useMaquinas, useRegistrosProduccion, useGastos, useCotizaciones } from "@/hooks/useSupabaseData";

const tooltipStyle = {
  backgroundColor: "hsl(220, 18%, 12%)",
  border: "1px solid hsl(220, 15%, 18%)",
  borderRadius: "8px",
  color: "hsl(210, 20%, 92%)",
};

const Dashboard = () => {
  const { data: ordenes } = useOrdenesProduccion();
  const { data: maquinas } = useMaquinas();
  const { data: registros } = useRegistrosProduccion();
  const { data: gastos } = useGastos();
  const { data: cotizaciones } = useCotizaciones();

  const activeOrders = ordenes?.filter(o => o.status === "pendiente" || o.status === "en_proceso") || [];
  const totalProduced = registros?.reduce((s, r) => s + (r.piezas_producidas || 0), 0) || 0;
  const totalScrap = registros?.reduce((s, r) => s + (r.piezas_scrap || 0), 0) || 0;
  const scrapRate = totalProduced > 0 ? ((totalScrap / (totalProduced + totalScrap)) * 100).toFixed(1) : "0";
  const totalGastos = gastos?.reduce((s, g) => s + Number(g.monto), 0) || 0;
  const totalCotizado = cotizaciones?.filter(c => c.status === "aprobada" || c.status === "convertida").reduce((s, c) => s + Number(c.total), 0) || 0;

  const machineOEE = maquinas?.map(m => ({
    name: m.nombre,
    oee: Math.round((Number(m.oee_disponibilidad) * Number(m.oee_rendimiento) * Number(m.oee_calidad)) / 10000),
  })) || [];

  const avgOEE = machineOEE.length ? (machineOEE.reduce((s, m) => s + m.oee, 0) / machineOEE.length).toFixed(1) : "0";

  // Daily production trend
  const dailyData = registros?.reduce((acc, r) => {
    const day = r.fecha;
    if (!acc[day]) acc[day] = { fecha: day, piezas: 0, scrap: 0 };
    acc[day].piezas += r.piezas_producidas || 0;
    acc[day].scrap += r.piezas_scrap || 0;
    return acc;
  }, {} as Record<string, { fecha: string; piezas: number; scrap: number }>) || {};
  const dailyChart = Object.values(dailyData).sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(-14);

  const stats = [
    { title: "Órdenes Activas", value: activeOrders.length.toString(), icon: Factory, change: `${ordenes?.length || 0} totales` },
    { title: "Producción Total", value: totalProduced.toLocaleString(), icon: Package, change: "piezas fabricadas" },
    { title: "Scrap Rate", value: `${scrapRate}%`, icon: AlertTriangle, change: `${totalScrap} piezas` },
    { title: "OEE Promedio", value: `${avgOEE}%`, icon: TrendingUp, change: `${maquinas?.length || 0} máquinas` },
    { title: "Gastos Totales", value: `$${totalGastos.toLocaleString()}`, icon: DollarSign, change: `${gastos?.length || 0} registros` },
    { title: "Cotizado Aprobado", value: `$${totalCotizado.toLocaleString()}`, icon: ShoppingCart, change: `${cotizaciones?.filter(c => c.status === "aprobada" || c.status === "convertida").length || 0} cotizaciones` },
  ];

  const statusSc: Record<string, string> = {
    pendiente: "bg-warning/20 text-warning", en_proceso: "bg-info/20 text-info",
    terminado: "bg-success/20 text-success", pausado: "bg-secondary text-secondary-foreground",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de operaciones</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <Card key={s.title}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
                </div>
                <s.icon className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {machineOEE.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">OEE por Máquina</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={machineOEE} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(215, 15%, 50%)" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={120} stroke="hsl(215, 15%, 50%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="oee" fill="hsl(160, 64%, 43%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {dailyChart.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Producción Diaria (últimos 14 días)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 18%)" />
                  <XAxis dataKey="fecha" stroke="hsl(215, 15%, 50%)" fontSize={10} />
                  <YAxis stroke="hsl(215, 15%, 50%)" fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="piezas" stroke="hsl(160, 64%, 43%)" strokeWidth={2} name="Piezas" />
                  <Line type="monotone" dataKey="scrap" stroke="hsl(0, 84%, 60%)" strokeWidth={2} name="Scrap" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Órdenes Recientes</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!ordenes?.length ? (
            <div className="p-8 text-center text-muted-foreground">No hay órdenes de producción aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border">
                  {["Orden","Cliente","Producto","Estado","Progreso"].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}
                </tr></thead>
                <tbody>
                  {ordenes.slice(0, 10).map(o => {
                    const progress = o.cantidad_requerida > 0 ? Math.min(100, Math.round((o.cantidad_producida / o.cantidad_requerida) * 100)) : 0;
                    return (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="py-3 px-4 font-mono text-primary">{o.folio}</td>
                        <td className="py-3 px-4 text-foreground">{(o as any).clientes?.nombre || "—"}</td>
                        <td className="py-3 px-4 text-foreground">{o.producto}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusSc[o.status] || ""}`}>
                            {o.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{progress}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
