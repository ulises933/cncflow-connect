import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const SimpleTable = ({ headers, rows, onDelete }: { headers: string[]; rows: any[][]; onDelete?: (id: string) => void }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead><tr className="border-b border-border">
        {headers.map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">{h}</th>)}
        {onDelete && <th className="py-2 px-3 text-xs"></th>}
      </tr></thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr key={idx} className="border-b border-border/50 hover:bg-secondary/50">
            {row.slice(1).map((cell, ci) => <td key={ci} className="py-2 px-3">{cell}</td>)}
            {onDelete && <td className="py-2 px-3"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(row[0])}><Trash2 className="h-3 w-3 text-destructive" /></Button></td>}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SimpleTable;
