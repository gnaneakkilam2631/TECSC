import { useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function Inventory({ items, refreshAll }) {
  const [form, setForm] = useState({ name: "", qty: 1, costPrice: "", sellingPrice: "", supplier: "", date: todayISO(), lowStockThreshold: 5 });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  async function addItem(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.costPrice) return;
    setBusy(true);
    try {
      await api.addItem({
        id: uid("item"),
        ...form,
        qty: Number(form.qty),
        costPrice: Number(form.costPrice),
        sellingPrice: form.sellingPrice ? Number(form.sellingPrice) : null,
        lowStockThreshold: Number(form.lowStockThreshold),
      });
      await refreshAll();
      setForm({ name: "", qty: 1, costPrice: "", sellingPrice: "", supplier: "", date: todayISO(), lowStockThreshold: 5 });
    } catch (err) {
      setError(err.message || "Could not add item.");
    } finally {
      setBusy(false);
    }
  }

  async function removeItem(id) {
    try {
      await api.deleteItem(id);
      await refreshAll();
    } catch (err) {
      setError(err.message || "Could not remove item.");
    }
  }

  function shift(delta) {
    let m = ym.month + delta,
      y = ym.year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setYm({ year: y, month: m });
  }

  const monthLabel = new Date(ym.year, ym.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const monthItems = items.filter((i) => {
    const d = new Date(i.date);
    return d.getFullYear() === ym.year && d.getMonth() === ym.month;
  });
  const monthCost = monthItems.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const monthRevenuePotential = monthItems.reduce((s, i) => s + i.qty * (i.sellingPrice || 0), 0);
  const monthProfitPotential = monthRevenuePotential - monthCost;

  return (
    <div>
      <SectionHeader title="Inventory & purchases" sub="Items bought in for the shop, with cost and selling price" />
      <form
        onSubmit={addItem}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm flex-1 min-w-[140px]" placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-20" type="number" min="1" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Selling price" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Supplier / market" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-24" type="number" placeholder="Low stock at" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Adding…" : "Add"}
        </button>
      </form>
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => shift(-1)} className="btn btn-outline p-1.5">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm mono w-36 text-center">{monthLabel}</span>
        <button onClick={() => shift(1)} className="btn btn-outline p-1.5">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono">{fmtMoney(monthCost)}</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Total cost this month</p>
        </div>
        <div className="p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono">{fmtMoney(monthRevenuePotential)}</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Potential revenue if all sold</p>
        </div>
        <div className="p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono" style={{ color: monthProfitPotential >= 0 ? "var(--accent)" : "var(--warn)" }}>
            {fmtMoney(monthProfitPotential)}
          </p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Potential profit</p>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="grid grid-cols-7 gap-2 px-4 py-2 text-xs font-medium row-line" style={{ color: "var(--ink-muted)" }}>
          <span className="col-span-2">Item</span>
          <span>Qty</span>
          <span>Cost</span>
          <span>Sell</span>
          <span>Supplier</span>
          <span>Date</span>
        </div>
        {monthItems.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No purchases recorded for {monthLabel}.
          </p>
        )}
        {monthItems.map((i) => (
          <div key={i.id} className="grid grid-cols-7 gap-2 px-4 py-2 text-sm row-line items-center">
            <span className="col-span-2 flex items-center gap-1.5">
              {i.name}
              {i.qty <= i.lowStockThreshold && (
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                  low
                </span>
              )}
            </span>
            <span className="mono">{i.qty}</span>
            <span className="mono">{fmtMoney(i.costPrice)}</span>
            <span className="mono" style={{ color: "var(--ink-muted)" }}>{i.sellingPrice ? fmtMoney(i.sellingPrice) : "—"}</span>
            <span style={{ color: "var(--ink-muted)" }}>{i.supplier || "—"}</span>
            <span className="flex items-center justify-between">
              <span className="mono text-xs">{i.date}</span>
              <button onClick={() => removeItem(i.id)} style={{ color: "var(--ink-muted)" }}>
                <X size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}