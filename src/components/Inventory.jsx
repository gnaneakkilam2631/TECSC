import { useState } from "react";
import { Plus, X } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";

export default function Inventory({ items, setItems }) {
  const [form, setForm] = useState({ name: "", qty: 1, costPrice: "", supplier: "", date: todayISO() });

  function addItem(e) {
    e.preventDefault();
    if (!form.name || !form.costPrice) return;
    setItems([{ id: uid("item"), ...form, qty: Number(form.qty), costPrice: Number(form.costPrice) }, ...items]);
    setForm({ name: "", qty: 1, costPrice: "", supplier: "", date: todayISO() });
  }

  function removeItem(id) {
    setItems(items.filter((i) => i.id !== id));
  }

  return (
    <div>
      <SectionHeader title="Inventory & purchases" sub="Items bought in for the shop" />
      <form
        onSubmit={addItem}
        className="flex flex-wrap gap-2 mb-5 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm flex-1 min-w-[140px]" placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-20" type="number" min="1" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Cost price" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <button className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> Add
        </button>
      </form>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium row-line" style={{ color: "var(--ink-muted)" }}>
          <span className="col-span-2">Item</span>
          <span>Qty</span>
          <span>Cost</span>
          <span>Supplier</span>
          <span>Date</span>
        </div>
        {items.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No purchases recorded yet.
          </p>
        )}
        {items.map((i) => (
          <div key={i.id} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm row-line items-center">
            <span className="col-span-2">{i.name}</span>
            <span className="mono">{i.qty}</span>
            <span className="mono">{fmtMoney(i.costPrice)}</span>
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
