import { useState } from "react";
import { Plus, Printer } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function Billing({ items, sales, refreshAll }) {
  const [form, setForm] = useState({ itemId: "", qty: 1, unitPrice: "", customerName: "", customerPhone: "", date: todayISO() });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stockItems = items.filter((i) => i.qty > 0);

  function handleItemSelect(itemId) {
    const item = items.find((i) => i.id === itemId);
    setForm({ ...form, itemId, unitPrice: item?.sellingPrice ?? item?.costPrice ?? "" });
  }

  async function addSale(e) {
    e.preventDefault();
    setError("");
    if (!form.qty || !form.unitPrice) return;
    const item = items.find((i) => i.id === form.itemId);
    if (!item && !form.itemId) return setError("Pick an item.");
    if (item && Number(form.qty) > item.qty) return setError(`Only ${item.qty} in stock.`);

    setBusy(true);
    try {
      await api.addSale({
        id: uid("sale"),
        itemId: form.itemId || null,
        itemName: item?.name || "Item",
        qty: Number(form.qty),
        unitPrice: Number(form.unitPrice),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        date: form.date,
      });
      await refreshAll();
      setForm({ itemId: "", qty: 1, unitPrice: "", customerName: "", customerPhone: "", date: todayISO() });
    } catch (err) {
      setError(err.message || "Could not record sale.");
    } finally {
      setBusy(false);
    }
  }

  function printInvoice(sale) {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Invoice</title></head>
      <body style="font-family: sans-serif; padding: 24px;">
        <h2>Trinadh Electronics &amp; Computer Servicing Centre</h2>
        <p>Invoice — ${sale.date}</p>
        <hr />
        <p>Customer: ${sale.customerName || "—"} ${sale.customerPhone ? `(${sale.customerPhone})` : ""}</p>
        <table style="width:100%; border-collapse: collapse; margin-top:16px;">
          <tr style="border-bottom:1px solid #ccc;"><th align="left">Item</th><th align="right">Qty</th><th align="right">Unit price</th><th align="right">Total</th></tr>
          <tr><td>${sale.itemName}</td><td align="right">${sale.qty}</td><td align="right">${fmtMoney(sale.unitPrice)}</td><td align="right">${fmtMoney(sale.total)}</td></tr>
        </table>
        <h3 style="text-align:right; margin-top:16px;">Total: ${fmtMoney(sale.total)}</h3>
      </body></html>
    `);
    w.document.close();
    w.print();
  }

  const monthTotal = sales
    .filter((s) => s.date.slice(0, 7) === todayISO().slice(0, 7))
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div>
      <SectionHeader title="Billing" sub="Sell items to customers — stock updates automatically" />
      <form
        onSubmit={addSale}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <select className="input px-2 py-1.5 text-sm w-44" value={form.itemId} onChange={(e) => handleItemSelect(e.target.value)}>
          <option value="">Select item from stock</option>
          {stockItems.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} ({i.qty} in stock)
            </option>
          ))}
        </select>
        <input className="input px-2 py-1.5 text-sm w-20" type="number" min="1" placeholder="Qty" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Unit price" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-32" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Recording…" : "Record sale"}
        </button>
      </form>
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}

      <div className="p-3 mb-4" style={{ background: "var(--accent-soft)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <span className="text-sm" style={{ color: "var(--accent-ink)" }}>
          This month's sales: <strong className="mono">{fmtMoney(monthTotal)}</strong>
        </span>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium row-line" style={{ color: "var(--ink-muted)" }}>
          <span className="col-span-2">Item</span>
          <span>Qty</span>
          <span>Total</span>
          <span>Customer</span>
          <span>Date</span>
        </div>
        {sales.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No sales recorded yet.
          </p>
        )}
        {sales.map((s) => (
          <div key={s.id} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm row-line items-center">
            <span className="col-span-2">{s.itemName}</span>
            <span className="mono">{s.qty}</span>
            <span className="mono">{fmtMoney(s.total)}</span>
            <span style={{ color: "var(--ink-muted)" }}>{s.customerName || "—"}</span>
            <span className="flex items-center justify-between">
              <span className="mono text-xs">{s.date}</span>
              <button onClick={() => printInvoice(s)} style={{ color: "var(--ink-muted)" }} title="Print invoice">
                <Printer size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}