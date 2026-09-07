import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function Suppliers({ items, refreshAll }) {
  async function markPaid(id) {
    await api.updateItem(id, { paid: true });
    await refreshAll();
  }

  const bySupplier = {};
  for (const i of items) {
    const key = i.supplier || "Unknown supplier";
    if (!bySupplier[key]) bySupplier[key] = { items: [], owed: 0 };
    bySupplier[key].items.push(i);
    if (!i.paid) bySupplier[key].owed += i.qty * i.costPrice;
  }
  const supplierList = Object.entries(bySupplier).sort((a, b) => b[1].owed - a[1].owed);
  const totalOwed = supplierList.reduce((s, [, v]) => s + v.owed, 0);

  return (
    <div>
      <SectionHeader title="Suppliers" sub="What you owe each supplier for stock purchased" />

      <div className="p-3 mb-4" style={{ background: totalOwed > 0 ? "var(--warn-soft)" : "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <span className="text-sm" style={{ color: totalOwed > 0 ? "var(--warn)" : "var(--accent-ink)" }}>
          Total owed across all suppliers: <strong className="mono">{fmtMoney(totalOwed)}</strong>
        </span>
      </div>

      <div className="space-y-3">
        {supplierList.length === 0 && (
          <p className="p-4 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--ink-muted)" }}>
            No purchases recorded yet.
          </p>
        )}
        {supplierList.map(([supplier, data]) => (
          <div key={supplier} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <div className="flex items-center justify-between px-4 py-3 row-line">
              <span className="text-sm font-medium">{supplier}</span>
              <span className="mono text-sm" style={{ color: data.owed > 0 ? "var(--warn)" : "var(--ink-muted)" }}>
                {data.owed > 0 ? `Owed ${fmtMoney(data.owed)}` : "Fully paid"}
              </span>
            </div>
            {data.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between px-4 py-2 row-line text-xs">
                <span>
                  {i.name} — {i.qty} × {fmtMoney(i.costPrice)} = {fmtMoney(i.qty * i.costPrice)}
                </span>
                {i.paid ? (
                  <span style={{ color: "var(--accent)" }}>Paid</span>
                ) : (
                  <button onClick={() => markPaid(i.id)} className="btn btn-outline px-2 py-1">
                    Mark paid
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}