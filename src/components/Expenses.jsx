import { useState } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

const CATEGORIES = ["Rent", "Electricity", "Water", "Internet", "Salaries", "Transport", "Maintenance", "Other"];

export default function Expenses({ expenses, refreshAll }) {
  const [form, setForm] = useState({ category: "Rent", amount: "", date: todayISO(), notes: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  async function addExpense(e) {
    e.preventDefault();
    setError("");
    if (!form.amount) return;
    setBusy(true);
    try {
      await api.addExpense({ id: uid("exp"), ...form, amount: Number(form.amount) });
      await refreshAll();
      setForm({ category: "Rent", amount: "", date: todayISO(), notes: "" });
    } catch (err) {
      setError(err.message || "Could not add expense.");
    } finally {
      setBusy(false);
    }
  }

  async function removeExpense(id) {
    await api.deleteExpense(id);
    await refreshAll();
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
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === ym.year && d.getMonth() === ym.month;
  });
  const monthTotal = monthExpenses.reduce((s, e) => s + e.amount, 0);

  const byCategory = {};
  for (const e of monthExpenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
  }

  return (
    <div>
      <SectionHeader title="Expenses" sub="Rent, electricity, and other running costs" />
      <form
        onSubmit={addExpense}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <select className="input px-2 py-1.5 text-sm w-36" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm flex-1 min-w-[160px]" placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Adding…" : "Add expense"}
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

      <div className="p-3 mb-4" style={{ background: "var(--warn-soft)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <span className="text-sm" style={{ color: "var(--warn)" }}>
          Total expenses this month: <strong className="mono">{fmtMoney(monthTotal)}</strong>
        </span>
        {Object.keys(byCategory).length > 0 && (
          <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
            {Object.entries(byCategory)
              .map(([cat, amt]) => `${cat}: ${fmtMoney(amt)}`)
              .join(" · ")}
          </p>
        )}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {monthExpenses.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No expenses recorded for {monthLabel}.
          </p>
        )}
        {monthExpenses.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
            <span>
              {e.category}
              {e.notes && <span style={{ color: "var(--ink-muted)" }}> — {e.notes}</span>}
            </span>
            <span className="flex items-center gap-3">
              <span className="mono">{fmtMoney(e.amount)}</span>
              <span className="mono text-xs" style={{ color: "var(--ink-muted)" }}>
                {e.date}
              </span>
              <button onClick={() => removeExpense(e.id)} style={{ color: "var(--ink-muted)" }}>
                <X size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}