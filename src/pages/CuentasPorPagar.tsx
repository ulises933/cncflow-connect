import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Eye, DollarSign, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PrintDocument from "@/components/PrintDocument";
import { useCuentasPorPagar, usePagosProveedores, useCreatePagoProveedor, useUpdateCuentaPorPagar } from "@/hooks/useSupabaseData";

const statusColors: Record<string, string> = {
  pendiente: "bg-warning/20 text-warning",
  parcial: "bg-primary/20 text-primary",
  pagada: "bg-success/20 text-success",
  vencida: "bg-destructive/20 text-destructive",
};
const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  parcial: "Parcialmente Pagada",
  pagada: "Pagada",
  vencida: "Vencida",
};

const CuentasPorPagar = () => {
  const { data: cuentas, isLoading } = useCuentasPorPagar();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [pagoOpen, setPagoOpen] = useState(false);
  const [pagoMonto, setPagoMonto] = useState("");
  const [pagoMetodo, setPagoMetodo] = useState("transferencia");
  const [pagoRef, setPagoRef] = useState("");
  const [pagoNotas, setPagoNotas] = useState("");

  const detail = cuentas?.find((c: any) => c.id === detailId);
  const { data: pagos } = usePagosProveedores(detailId);
  const createPago = useCreatePagoProveedor();
  const updateCxP = useUpdateCuentaPorPagar();

  const filtered = filter === "all" ? cuentas : cuentas?.filter((c: any) => c.status === filter);
  const totalPendiente = cuentas?.filter((c: any) => c.status !== "pagada").reduce((s: number, c: any) => s + Number(c.saldo), 0) || 0;
  const totalPagado = cuentas?.reduce((s: number, c: any) => s + (Number(c.monto) - Number(c.saldo)), 0) || 0;

  const handleRegistrarPago = async () => {
    if (!detailId || !pagoMonto) return;
    const monto = Number(pagoMonto);
    if (monto <= 0) { toast.error("El monto debe ser mayor a 0"); return; }
    if (detail && monto > Number(detail.saldo)) { toast.error("El monto excede el saldo pendiente"); return; }

    await createPago.mutateAsync({
      cuenta_por_pagar_id: detailId,
      monto,
      metodo_pago: pagoMetodo,
      referencia: pagoRef || undefined,
      notas: pagoNotas || undefined,
    });

    const nuevoSaldo = Number(detail!.saldo) - monto;
    await updateCxP.mutateAsync({ id: detailId, saldo: Math.max(0, nuevoSaldo), status: nuevoSaldo <= 0 ? "pagada" : "parcial" });

    setPagoOpen(false);
    setPagoMonto("");
    setPagoRef("");
    setPagoNotas("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cuentas por Pagar</h1>
        <p className="text-muted-foreground">Seguimiento de pagos pendientes a proveedores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Pendiente</p>
          <p className="text-2xl font-bold text-foreground">${totalPendiente.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Pagado</p>
          <p className="text-2xl font-bold text-success">${totalPagado.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Cuentas Activas</p>
          <p className="text-2xl font-bold text-foreground">{cuentas?.filter((c: any) => c.status !== "pagada").length || 0}</p>
        </CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pendiente", "parcial", "pagada", "vencida"].map(s => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)}>
            {s === "all" ? "Todas" : statusLabels[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? <div className="p-4 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
            : !filtered?.length ? <div className="p-8 text-center text-muted-foreground">No hay cuentas por pagar.</div>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border">
                    {["Folio", "Proveedor", "OC", "Monto", "Saldo", "Estado", "Emisión", "Vencimiento", ""].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered?.map((c: any) => (
                      <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-primary">{c.folio}</td>
                        <td className="py-3 px-4">{c.proveedores?.nombre || "—"}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{c.ordenes_compra?.folio || "—"}</td>
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
          <DialogHeader><DialogTitle>Cuenta por Pagar {detail?.folio}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p className="text-muted-foreground">Proveedor</p><p className="font-semibold">{(detail as any).proveedores?.nombre || "—"}</p></div>
                <div><p className="text-muted-foreground">Monto Total</p><p className="font-mono font-semibold">${Number(detail.monto).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Saldo Pendiente</p><p className="font-mono font-semibold text-primary">${Number(detail.saldo).toLocaleString()}</p></div>
                <div><p className="text-muted-foreground">Estado</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[detail.status]}`}>{statusLabels[detail.status] || detail.status}</span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {detail.status !== "pagada" && (
                  <Button onClick={() => { setPagoMonto(String(detail.saldo)); setPagoOpen(true); }} className="bg-success hover:bg-success/90 text-success-foreground">
                    <DollarSign className="h-4 w-4 mr-2" />Registrar Pago
                  </Button>
                )}
                <PrintDocument
                  title="Cuenta por Pagar"
                  folio={detail.folio}
                  fecha={detail.fecha_emision}
                  clienteNombre={(detail as any).proveedores?.nombre}
                  total={detail.monto}
                  notas={detail.notas || undefined}
                >
                  <table>
                    <thead><tr>
                      {["Concepto", "Monto", "Saldo", "Estado"].map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      <tr>
                        <td>Orden de Compra {(detail as any).ordenes_compra?.folio || "—"}</td>
                        <td style={{ textAlign: "right" }}>${Number(detail.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        <td style={{ textAlign: "right" }}>${Number(detail.saldo).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
                        <td>{statusLabels[detail.status]}</td>
                      </tr>
                    </tbody>
                  </table>
                </PrintDocument>
              </div>

              {/* Pagos history */}
              <div>
                <h3 className="font-semibold mb-3">Historial de Pagos</h3>
                {pagos?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-border">
                        {["Folio", "Monto", "Método", "Referencia", "Fecha", ""].map(h => (
                          <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {pagos.map((p: any) => (
                          <tr key={p.id} className="border-b border-border/50">
                            <td className="py-2 px-3 font-mono text-primary">{p.folio}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-success">${Number(p.monto).toLocaleString()}</td>
                            <td className="py-2 px-3 capitalize">{p.metodo_pago}</td>
                            <td className="py-2 px-3 text-muted-foreground">{p.referencia || "—"}</td>
                            <td className="py-2 px-3 text-muted-foreground">{p.fecha}</td>
                            <td className="py-2 px-3">
                              <PrintDocument
                                title="Comprobante de Pago"
                                folio={p.folio}
                                fecha={p.fecha}
                                clienteNombre={(detail as any).proveedores?.nombre}
                                total={p.monto}
                                notas={p.notas || undefined}
                              >
                                <table>
                                  <thead><tr>{["Concepto", "Método", "Referencia", "Monto"].map(h => <th key={h}>{h}</th>)}</tr></thead>
                                  <tbody>
                                    <tr>
                                      <td>Pago a CXP {detail.folio}</td>
                                      <td className="capitalize">{p.metodo_pago}</td>
                                      <td>{p.referencia || "—"}</td>
                                      <td style={{ textAlign: "right", fontWeight: 600 }}>${Number(p.monto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</td>
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
                ) : <p className="text-muted-foreground text-sm">Sin pagos registrados</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pago Dialog */}
      <Dialog open={pagoOpen} onOpenChange={setPagoOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pago — {detail?.folio}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Saldo pendiente: <span className="font-mono font-semibold text-foreground">${Number(detail?.saldo || 0).toLocaleString()}</span></p>
            <div><Label>Monto</Label><Input type="number" value={pagoMonto} onChange={e => setPagoMonto(e.target.value)} placeholder="0.00" /></div>
            <div><Label>Método de Pago</Label>
              <Select value={pagoMetodo} onValueChange={setPagoMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["transferencia", "efectivo", "cheque", "tarjeta", "otro"].map(m => <SelectItem key={m} value={m} className="capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Referencia</Label><Input value={pagoRef} onChange={e => setPagoRef(e.target.value)} placeholder="Número de transferencia, cheque, etc." /></div>
            <div><Label>Notas</Label><Textarea value={pagoNotas} onChange={e => setPagoNotas(e.target.value)} placeholder="Observaciones..." /></div>
            <Button onClick={handleRegistrarPago} className="w-full" disabled={createPago.isPending}>
              {createPago.isPending ? "Registrando..." : "Confirmar Pago"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CuentasPorPagar;
