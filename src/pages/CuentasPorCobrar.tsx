import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PrintDocument from "@/components/PrintDocument";
import { useCuentasPorCobrar, useCobros, useCreateCobro, useUpdateCuentaPorCobrar } from "@/hooks/useSupabaseData";

const statusColors: Record<string, string> = {
  pendiente: "bg-warning/20 text-warning",
  parcial: "bg-primary/20 text-primary",
  cobrada: "bg-success/20 text-success",
  vencida: "bg-destructive/20 text-destructive",
};
const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "Parcialmente Cobrada",
  cobrada: "Cobrada",
  vencida: "Vencida",
};

const CuentasPorCobrar = () => {
  const { data: cuentas, isLoading } = useCuentasPorCobrar();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [cobroOpen, setCobroOpen] = useState(false);
  const [cobroMonto, setCobroMonto] = useState("");
  const [cobroMetodo, setCobroMetodo] = useState("transferencia");
  const [cobroRef, setCobroRef] = useState("");
  const [cobroNotas, setCobroNotas] = useState("");

  const detail = cuentas?.find(c => c.id === detailId);
  const { data: cobros } = useCobros(detailId);
  const createCobro = useCreateCobro();
  const updateCxC = useUpdateCuentaPorCobrar();

  const filtered = filter === "all" ? cuentas : cuentas?.filter(c => c.status === filter);

  const totalPendiente = cuentas?.filter(c => c.status !== "cobrada").reduce((s, c) => s + Number(c.saldo), 0) || 0;
  const totalCobrado = cuentas?.reduce((s, c) => s + (Number(c.monto) - Number(c.saldo)), 0) || 0;

  const handleRegistrarCobro = async () => {
    if (!detailId || !cobroMonto) return;
    const monto = Number(cobroMonto);
    if (monto <= 0) { toast.error("El monto debe ser mayor a 0"); return; }
    if (detail && monto > Number(detail.saldo)) { toast.error("El monto excede el saldo pendiente"); return; }

    await createCobro.mutateAsync({
      cuenta_por_cobrar_id: detailId,
      monto,
      metodo_pago: cobroMetodo,
      referencia: cobroRef || undefined,
      notas: cobroNotas || undefined,
    });

    const nuevoSaldo = Number(detail!.saldo) - monto;
    const nuevoStatus = nuevoSaldo <= 0 ? "cobrada" : "parcial";
    await updateCxC.mutateAsync({ id: detailId, saldo: Math.max(0, nuevoSaldo), status: nuevoStatus });

    setCobroOpen(false);
    setCobroMonto("");
    setCobroRef("");
    setCobroNotas("");
    toast.success("Cobro registrado exitosamente");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cuentas por Cobrar</h1>
        <p className="text-muted-foreground">Seguimiento de pagos pendientes de clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Pendiente</p>
          <p className="text-2xl font-bold text-foreground">${totalPendiente.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Cobrado</p>
          <p className="text-2xl font-bold text-success">${totalCobrado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cuentas Activas</p>
          <p className="text-2xl font-bold text-foreground">{cuentas?.filter(c => c.status !== "cobrada").length || 0}</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pendiente", "parcial", "cobrada", "vencida"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todas" : statusLabels[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay cuentas por cobrar.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Folio", "Cliente", "Monto", "Saldo", "Estado", "Emisión", "Vencimiento", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered?.map(c => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{c.folio}</td>
                        <td className="py-3 px-4">{(c as any).clientes?.nombre || "—"}</td>
                        <td className="py-3 px-4 font-mono">${Number(c.monto).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono font-semibold">${Number(c.saldo).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>{statusLabels[c.status] || c.status}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{c.fecha_emision}</td>
                        <td className="py-3 px-4 text-muted-foreground">{c.fecha_vencimiento || "—"}</td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="icon" onClick={() => setDetailId(c.id)}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Cuenta por Cobrar {detail?.folio}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Cliente</p><p className="font-semibold">{(detail as any).clientes?.nombre || "—"}</p></div>
                <div><p className="text-muted-foreground">Monto Total</p><p className="font-mono font-semibold">${Number(detail.monto).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Saldo Pendiente</p><p className="font-mono font-semibold text-primary">${Number(detail.saldo).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status] || detail.status}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {detail.status !== "cobrada" && (
                  <Button onClick={() => { setCobroMonto(String(detail.saldo)); setCobroOpen(true); }} className="bg-success hover:bg-success/90 text-success-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />Registrar Cobro
                  </Button>
                )}
                <PrintDocument
                  title="Cuenta por Cobrar"
                  folio={detail.folio}
                  fecha={detail.fecha_emision}
                  clienteNombre={(detail as any).clientes?.nombre}
                  total={detail.monto}
                  notas={detail.notas || undefined}
                >
                  <table>
                    <thead><tr>{["Concepto", "Monto", "Saldo", "Estado"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      <tr>
                        <td>Cotización {(detail as any).cotizaciones?.folio || "—"}</td>
                        <td style={{ textAlign: "right" }}>${Number(detail.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: "right" }}>${Number(detail.saldo).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        <td>{statusLabels[detail.status]}</td>
                      </tr>
                    </tbody>
                  </table>
                </PrintDocument>
              </div>

              {/* Cobros history */}
              <div>
                <h3 className="font-semibold mb-3">Historial de Cobros</h3>
                {cobros?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Folio", "Monto", "Método", "Referencia", "Fecha", ""].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {cobros.map((co: any) => (
                          <tr key={co.id} className="border-b border-border/50">
                            <td className="py-2 px-3 font-mono text-primary">{co.folio}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-success">${Number(co.monto).toLocaleString()}</td>
                            <td className="py-2 px-3 capitalize">{co.metodo_pago}</td>
                            <td className="py-2 px-3 text-muted-foreground">{co.referencia || "—"}</td>
                            <td className="py-2 px-3 text-muted-foreground">{co.fecha}</td>
                            <td className="py-2 px-3">
                              <PrintDocument
                                title="Comprobante de Cobro"
                                folio={co.folio}
                                fecha={co.fecha}
                                clienteNombre={(detail as any).clientes?.nombre}
                                total={co.monto}
                                notas={co.notas || undefined}
                              >
                                <table>
                                  <thead><tr>{["Concepto", "Método", "Referencia", "Monto"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                  <tbody>
                                    <tr>
                                      <td>Cobro de CXC {detail.folio}</td>
                                      <td className="capitalize">{co.metodo_pago}</td>
                                      <td>{co.referencia || "—"}</td>
                                      <td style={{ textAlign: "right", fontWeight: 600 }}>${Number(co.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </PrintDocument>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted-foreground text-sm">Sin cobros registrados</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cobro Dialog */}
      <Dialog open={cobroOpen} onOpenChange={setCobroOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Cobro — {detail?.folio}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Saldo pendiente: <span className="font-mono font-semibold text-foreground">${Number(detail?.saldo || 0).toLocaleString()}</span></p>
            <div><label className="text-sm font-medium">Monto</label><Input type="number" value={cobroMonto} onChange={e => setCobroMonto(e.target.value)} placeholder="0.00" /></div>
            <div><label className="text-sm font-medium">Método de Pago</label>
              <Select value={cobroMetodo} onValueChange={setCobroMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["transferencia", "efectivo", "cheque", "tarjeta", "otro"].map(m => <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Referencia</label><Input value={cobroRef} onChange={e => setCobroRef(e.target.value)} placeholder="Número de referencia bancaria" /></div>
            <div><label className="text-sm font-medium">Notas</label><Textarea value={cobroNotas} onChange={e => setCobroNotas(e.target.value)} placeholder="Observaciones..." /></div>
            <Button onClick={handleRegistrarCobro} className="w-full" disabled={createCobro.isPending}>
              {createCobro.isPending ? "Registrando..." : "Confirmar Cobro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CuentasPorCobrar;
