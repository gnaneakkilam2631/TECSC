import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function Rentals({ rentals, refreshAll }) {
  const [form, setForm] = useState({ itemName: "", customerName: "", customerPhone: "", rentOutDate: todayISO(), amountPaid: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [returnDrafts, setReturnDrafts] = useState({});
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });

  async function addRental(e) {
    e.preventDefault();
    setError("");
    if (!form.itemName || !form.customerName) return;
    setBusy(true);
    try {
      await api.addRental({ id: uid("rental"), ...form, amountPaid: form.amountPaid ? Number(form.amountPaid) : 0 });
      await refreshAll();
      setForm({ itemName: "", customerName: "", customerPhone: "", rentOutDate: todayISO(), amountPaid: "" });
    } catch (err) {
      setError(err.message || "Could not add rental.");
    } finally {
      setBusy(false);
    }
  }

  async function markReturned(id) {
    const extra = returnDrafts[id];
    await api.updateRental(id, {
      status: "returned",
      returnDate: todayISO(),
      amountPaid: extra ? Number(extra) : undefined,
    });
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
  const monthRentals = rentals.filter((r) => {
    const d = new Date(r.rentOutDate);
    return d.getFullYear() === ym.year && d.getMonth() === ym.month;
  });
  const monthIncome = monthRentals.reduce((s, r) => s + r.amountPaid, 0);
  const activeCount = rentals.filter((r) => r.status === "rented").length;

  return (
    <div>
      <SectionHeader title="Rentals" sub="Computers given out on rent, and when they came back" />
      <form
        onSubmit={addRental}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Item (e.g. HP laptop)" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-32" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.rentOutDate} onChange={(e) => setForm({ ...form, rentOutDate: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Paid so far" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Adding…" : "Add rental"}
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

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono">{fmtMoney(monthIncome)}</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Rental income this month</p>
        </div>
        <div className="p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono">{activeCount}</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>Currently out on rent</p>
        </div>
      </div>

      <div className="space-y-2">
        {monthRentals.length === 0 && (
          <p className="p-4 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--ink-muted)" }}>
            No rentals recorded for {monthLabel}.
          </p>
        )}
        {monthRentals.map((r) => (
          <div key={r.id} className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-medium">{r.itemName}</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {r.customerName} {r.customerPhone && `· ${r.customerPhone}`}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                  Out since {r.rentOutDate}
                  {r.returnDate && ` · Returned ${r.returnDate}`}
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={
                  r.status === "returned"
                    ? { background: "var(--accent-soft)", color: "var(--accent-ink)" }
                    : { background: "var(--gold-soft)", color: "var(--gold)" }
                }
              >
                {r.status}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono text-xs" style={{ color: "var(--ink-muted)" }}>
                Paid so far: {fmtMoney(r.amountPaid)}
              </span>
              {r.status === "rented" && (
                <>
                  <input
                    className="input px-2 py-1 text-xs w-28"
                    type="number"
                    placeholder="Final amount paid"
                    value={returnDrafts[r.id] ?? ""}
                    onChange={(e) => setReturnDrafts({ ...returnDrafts, [r.id]: e.target.value })}
                  />
                  <button onClick={() => markReturned(r.id)} className="btn btn-outline text-xs px-2 py-1">
                    Mark returned
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}