import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useTiposDescuento, useCreateTipoDescuento, useDeleteTipoDescuento, useTiposPrestamo, useCreateTipoPrestamo, useDeleteTipoPrestamo } from "@/hooks/useRHData";
import { Skeleton } from "@/components/ui/skeleton";
import SimpleTable from "@/components/rh/SimpleTable";

const RHCatalogos = () => {
  const { data: tiposDesc, isLoading: loadDesc } = useTiposDescuento();
  const createDesc = useCreateTipoDescuento();
  const deleteDesc = useDeleteTipoDescuento();
  const [descForm, setDescForm] = useState({ nombre: "", descripcion: "", porcentaje_default: 0 });

  const { data: tiposPrest, isLoading: loadPrest } = useTiposPrestamo();
  const createPrest = useCreateTipoPrestamo();
  const deletePrest = useDeleteTipoPrestamo();
  const [prestForm, setPrestForm] = useState({ nombre: "", descripcion: "", tasa_interes: 0, plazo_max_quincenas: 24 });

  const handleAddDesc = async () => {
    if (!descForm.nombre.trim()) return;
    await createDesc.mutateAsync(descForm);
    setDescForm({ nombre: "", descripcion: "", porcentaje_default: 0 });
  };

  const handleAddPrest = async () => {
    if (!prestForm.nombre.trim()) return;
    await createPrest.mutateAsync(prestForm);
    setPrestForm({ nombre: "", descripcion: "", tasa_interes: 0, plazo_max_quincenas: 24 });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Catálogos RH</h1>
        <p className="text-muted-foreground">Tipos de descuento y préstamo</p>
      </div>

      {/* Tipos de Descuento */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Tipos de Descuento</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label>Nombre</Label><Input value={descForm.nombre} onChange={e => setDescForm({ ...descForm, nombre: e.target.value })} placeholder="Ej: IMSS, ISR, Fondo Ahorro" /></div>
          <div className="w-32"><Label>% Default</Label><Input type="number" value={descForm.porcentaje_default} onChange={e => setDescForm({ ...descForm, porcentaje_default: Number(e.target.value) })} /></div>
          <Button onClick={handleAddDesc} disabled={createDesc.isPending}><Plus className="h-4 w-4" /></Button>
        </div>
        <Card><CardContent className="p-0">
          {loadDesc ? <Skeleton className="h-20 m-4" /> : !tiposDesc?.length ? <p className="p-4 text-muted-foreground text-sm">Sin tipos</p> : (
            <SimpleTable
              headers={["Nombre", "Descripción", "% Default"]}
              rows={tiposDesc.map(d => [d.id, d.nombre, d.descripcion || "—", `${d.porcentaje_default}%`])}
              onDelete={id => deleteDesc.mutate(id)}
            />
          )}
        </CardContent></Card>
      </div>

      {/* Tipos de Préstamo */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Tipos de Préstamo</h3>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><Label>Nombre</Label><Input value={prestForm.nombre} onChange={e => setPrestForm({ ...prestForm, nombre: e.target.value })} placeholder="Ej: Personal, Emergencia, Caja Ahorro" /></div>
          <div className="w-24"><Label>Tasa %</Label><Input type="number" value={prestForm.tasa_interes} onChange={e => setPrestForm({ ...prestForm, tasa_interes: Number(e.target.value) })} /></div>
          <div className="w-28"><Label>Plazo máx</Label><Input type="number" value={prestForm.plazo_max_quincenas} onChange={e => setPrestForm({ ...prestForm, plazo_max_quincenas: Number(e.target.value) })} /></div>
          <Button onClick={handleAddPrest} disabled={createPrest.isPending}><Plus className="h-4 w-4" /></Button>
        </div>
        <Card><CardContent className="p-0">
          {loadPrest ? <Skeleton className="h-20 m-4" /> : !tiposPrest?.length ? <p className="p-4 text-muted-foreground text-sm">Sin tipos</p> : (
            <SimpleTable
              headers={["Nombre", "Descripción", "Tasa %", "Plazo máx (qnas)"]}
              rows={tiposPrest.map(d => [d.id, d.nombre, d.descripcion || "—", `${d.tasa_interes}%`, d.plazo_max_quincenas])}
              onDelete={id => deletePrest.mutate(id)}
            />
          )}
        </CardContent></Card>
      </div>
    </div>
  );
};

export default RHCatalogos;
