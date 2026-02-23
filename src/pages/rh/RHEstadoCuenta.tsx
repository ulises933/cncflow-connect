import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEmpleados } from "@/hooks/useSupabaseData";
import { useEstadoCuenta } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHEstadoCuenta = () => {
  const { data: empleados } = useEmpleados();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: cuenta, isLoading } = useEstadoCuenta(selectedId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Estado de Cuenta</h1>
        <p className="text-muted-foreground">Consulta consolidada por empleado</p>
      </div>
      <Select value={selectedId || ""} onValueChange={v => setSelectedId(v)}>
        <SelectTrigger className="max-w-sm"><SelectValue placeholder="Seleccionar empleado..." /></SelectTrigger>
        <SelectContent>{(empleados || []).map(e => <SelectItem key={e.id} value={e.id}>{e.nombre}</SelectItem>)}</SelectContent>
      </Select>
      {selectedId && isLoading && <Skeleton className="h-40" />}
      {cuenta && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pagos</p><p className="text-lg font-bold">{cuenta.pagos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">T. Extra</p><p className="text-lg font-bold">{cuenta.tiempoExtra.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Descuentos</p><p className="text-lg font-bold text-destructive">{cuenta.descuentos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Préstamos</p><p className="text-lg font-bold">{cuenta.prestamos.length}</p></CardContent></Card>
            <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Faltas</p><p className="text-lg font-bold text-destructive">{cuenta.faltas.length}</p></CardContent></Card>
          </div>
          {cuenta.pagos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Últimos Pagos</h4>
              <SimpleTable
                headers={["Fecha", "Periodo", "Base", "T. Extra", "Descuentos", "Total"]}
                rows={cuenta.pagos.slice(0, 10).map((p: any) => [p.id, p.fecha, p.periodo, `$${Number(p.salario_base).toLocaleString()}`, `$${Number(p.tiempo_extra).toLocaleString()}`, `$${Number(p.descuentos).toLocaleString()}`, `$${Number(p.total).toLocaleString()}`])}
              />
            </div>
          )}
          {cuenta.prestamos.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Préstamos</h4>
              <SimpleTable
                headers={["Fecha", "Monto", "Saldo", "Estado"]}
                rows={cuenta.prestamos.map((p: any) => [p.id, p.fecha, `$${Number(p.monto).toLocaleString()}`, `$${Number(p.saldo).toLocaleString()}`, p.status])}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RHEstadoCuenta;
