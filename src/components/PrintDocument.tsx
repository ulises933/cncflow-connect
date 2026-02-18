import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import logoMrisa from "@/assets/logo-mrisa.png";

interface PrintDocumentProps {
  title: string;
  folio: string;
  fecha: string;
  clienteNombre?: string;
  clienteRFC?: string;
  clienteDireccion?: string;
  clienteContacto?: string;
  vendedor?: string;
  notas?: string;
  condiciones?: string;
  moneda?: string;
  subtotal?: number;
  iva?: number;
  total?: number;
  children: React.ReactNode;
  extraHeader?: React.ReactNode;
}

const PrintDocument = ({
  title, folio, fecha, clienteNombre, clienteRFC, clienteDireccion, clienteContacto,
  vendedor, notas, condiciones, moneda = "MXN", subtotal, iva, total, children, extraHeader,
}: PrintDocumentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = ref.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${title} ${folio}</title>
      <style>
        @page { size: letter; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
        body { color: #1a1a1a; font-size: 11px; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 16px; }
        .logo-section { display: flex; align-items: center; gap: 10px; }
        .logo-section img { height: 50px; object-fit: contain; }
        .company-info { font-size: 9px; color: #555; }
        .company-name { font-size: 14px; font-weight: 700; color: #1e3a5f; }
        .doc-info { text-align: right; }
        .doc-title { font-size: 16px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; }
        .doc-folio { font-size: 13px; font-weight: 600; color: #d97706; margin-top: 2px; }
        .doc-fecha { font-size: 10px; color: #666; margin-top: 2px; }
        .client-box { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; padding: 10px; background: #f8f9fb; border-radius: 6px; border: 1px solid #e5e7eb; }
        .client-box h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; font-weight: 600; }
        .client-box p { font-size: 11px; }
        .client-box .name { font-weight: 600; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        thead th { background: #1e3a5f; color: white; padding: 8px 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; }
        tbody tr:nth-child(even) { background: #f8f9fb; }
        .totals { display: flex; justify-content: flex-end; margin-bottom: 16px; }
        .totals-table { width: 240px; }
        .totals-table .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
        .totals-table .total-row { font-weight: 700; font-size: 14px; color: #1e3a5f; border-top: 2px solid #1e3a5f; padding-top: 6px; margin-top: 4px; }
        .notes { padding: 10px; background: #fffbeb; border-left: 3px solid #d97706; border-radius: 0 6px 6px 0; font-size: 10px; margin-bottom: 16px; }
        .notes h4 { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #d97706; margin-bottom: 4px; font-weight: 600; }
        .footer { border-top: 1px solid #ddd; padding-top: 12px; display: flex; justify-content: space-between; color: #999; font-size: 8px; margin-top: 24px; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
        .sig-line { border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 10px; color: #555; }
        .extra-header { margin-bottom: 12px; }
      </style>
    </head><body>${content.innerHTML}
    <div class="signatures">
      <div class="sig-line">Elaboró</div>
      <div class="sig-line">Autorizó / Cliente</div>
    </div>
    <div class="footer">
      <span>MRISA de C.V. — Documento generado el ${new Date().toLocaleDateString("es-MX")}</span>
      <span>${title} ${folio}</span>
    </div>
    </body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handlePrint}>
        <Printer className="h-4 w-4 mr-2" />Imprimir
      </Button>
      <div ref={ref} style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <div className="header">
          <div className="logo-section">
            <img src={logoMrisa} alt="MRISA" />
            <div>
              <div className="company-name">MRISA de C.V.</div>
              <div className="company-info">Manufactura y Servicios Industriales</div>
            </div>
          </div>
          <div className="doc-info">
            <div className="doc-title">{title}</div>
            <div className="doc-folio">{folio}</div>
            <div className="doc-fecha">Fecha: {fecha}</div>
          </div>
        </div>
        {extraHeader && <div className="extra-header">{extraHeader}</div>}
        <div className="client-box">
          <div>
            <h4>Cliente</h4>
            <p className="name">{clienteNombre || "—"}</p>
            {clienteRFC && <p>RFC: {clienteRFC}</p>}
            {clienteDireccion && <p>{clienteDireccion}</p>}
            {clienteContacto && <p>Contacto: {clienteContacto}</p>}
          </div>
          <div>
            <h4>Datos del documento</h4>
            {vendedor && <p>Vendedor: {vendedor}</p>}
            {condiciones && <p>Condiciones: {condiciones}</p>}
            <p>Moneda: {moneda}</p>
          </div>
        </div>
        {children}
        {(subtotal !== undefined || total !== undefined) && (
          <div className="totals">
            <div className="totals-table">
              {subtotal !== undefined && <div className="row"><span>Subtotal:</span><span>${Number(subtotal).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>}
              {iva !== undefined && <div className="row"><span>IVA (16%):</span><span>${Number(iva).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>}
              {total !== undefined && <div className="row total-row"><span>Total:</span><span>${Number(total).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span></div>}
            </div>
          </div>
        )}
        {notas && (
          <div className="notes">
            <h4>Notas / Observaciones</h4>
            <p>{notas}</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PrintDocument;
