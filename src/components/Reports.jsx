import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO } from "../lib/utils.js";

export default function Reports({ items, sales, repairs }) {
  const today = todayISO();
  const thisMonth = today.slice(0, 7);

  const bySales = {};
  for (const s of sales.filter((s) => s.date.slice(0, 7) === thisMonth)) {
    if (!bySales[s.itemName]) bySales[s.itemName] = { qty: 0, revenue: 0 };
    bySales[s.itemName].qty += s.qty;
    bySales[s.itemName].revenue += s.total;
  }
  const bestSellers = Object.entries(bySales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5);

  const lowStock = items.filter((i) => i.qty <= i.lowStockThreshold);

  const warrantyAlerts = repairs
    .filter((r) => r.dateOut && r.warrantyDays > 0)
    .map((r) => {
      const expiry = new Date(r.dateOut);
      expiry.setDate(expiry.getDate() + r.warrantyDays);
      const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24));
      return { ...r, expiry: expiry.toISOString().slice(0, 10), daysLeft };
    })
    .filter((r) => r.daysLeft >= 0 && r.daysLeft <= 7)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div>
      <SectionHeader title="Reports & alerts" />

      <p className="text-sm font-medium mb-2">Best sellers this month</p>
      <div className="mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {bestSellers.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No sales recorded yet this month.
          </p>
        )}
        {bestSellers.map(([name, data], i) => (
          <div key={name} className="flex items-center justify-between px-4 py-3 row-line text-sm">
            <span>
              <span className="mono mr-2" style={{ color: "var(--ink-muted)" }}>#{i + 1}</span>
              {name}
            </span>
            <span className="mono" style={{ color: "var(--ink-muted)" }}>
              {data.qty} sold · {fmtMoney(data.revenue)}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium mb-2">Low stock</p>
      <div className="mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {lowStock.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            Nothing is running low.
          </p>
        )}
        {lowStock.map((i) => (
          <div key={i.id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
            <span>{i.name}</span>
            <span className="mono" style={{ color: "var(--warn)" }}>
              {i.qty} left (threshold {i.lowStockThreshold})
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm font-medium mb-2">Warranty follow-ups due soon</p>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {warrantyAlerts.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No warranties expiring in the next 7 days.
          </p>
        )}
        {warrantyAlerts.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
            <span>
              {r.customerName} — {r.device}
              {r.customerPhone && <span style={{ color: "var(--ink-muted)" }}> · {r.customerPhone}</span>}
            </span>
            <span className="mono" style={{ color: "var(--gold)" }}>
              {r.daysLeft === 0 ? "Expires today" : `${r.daysLeft} day${r.daysLeft > 1 ? "s" : ""} left`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}