import { useState } from "react";
import { Plus, Phone } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

const STATUS_OPTIONS = ["received", "in progress", "waiting on part", "completed", "delivered"];
const STATUS_COLOR = {
  received: "var(--ink-muted)",
  "in progress": "var(--gold)",
  "waiting on part": "var(--warn)",
  completed: "var(--accent)",
  delivered: "var(--accent)",
};

export default function RepairAdmin({ repairs, refreshAll }) {
  const [form, setForm] = useState({ customerName: "", customerPhone: "", device: "", issue: "", dateIn: todayISO() });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [costDrafts, setCostDrafts] = useState({});

  async function addRepair(e) {
    e.preventDefault();
    setError("");
    if (!form.customerName || !form.device) return;
    setBusy(true);
    try {
      await api.addRepair({ id: uid("repair"), ...form });
      await refreshAll();
      setForm({ customerName: "", customerPhone: "", device: "", issue: "", dateIn: todayISO() });
    } catch (err) {
      setError(err.message || "Could not add job.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, status) {
    const updates = { status };
    if (status === "delivered") updates.dateOut = todayISO();
    await api.updateRepair(id, updates);
    await refreshAll();
  }

  async function saveCost(id) {
    const cost = costDrafts[id];
    if (cost === undefined || cost === "") return;
    await api.updateRepair(id, { cost: Number(cost) });
    await refreshAll();
  }

  return (
    <div>
      <SectionHeader title="Repair & service jobs" sub="Track devices brought in for repair" />
      <form
        onSubmit={addRepair}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-32" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Device (e.g. HP laptop)" value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm flex-1 min-w-[160px]" placeholder="Issue reported" value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-36" type="date" value={form.dateIn} onChange={(e) => setForm({ ...form, dateIn: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Adding…" : "Add job"}
        </button>
      </form>
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}
      <div className="space-y-2">
        {repairs.length === 0 && (
          <p className="p-4 text-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--ink-muted)" }}>
            No repair jobs yet.
          </p>
        )}
        {repairs.map((r) => (
          <div key={r.id} className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-sm font-medium">{r.customerName}</p>
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  {r.device} · brought in {r.dateIn}
                </p>
                {r.issue && (
                  <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                    {r.issue}
                  </p>
                )}
                {r.customerPhone && (
                  <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
                    <Phone size={11} /> {r.customerPhone}
                  </p>
                )}
              </div>
              <span className="dot flex-shrink-0 mt-1" style={{ background: STATUS_COLOR[r.status] }} />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="input px-2 py-1 text-xs"
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                className="input px-2 py-1 text-xs w-24"
                type="number"
                placeholder={r.cost != null ? fmtMoney(r.cost) : "Cost"}
                value={costDrafts[r.id] ?? ""}
                onChange={(e) => setCostDrafts({ ...costDrafts, [r.id]: e.target.value })}
              />
              <button onClick={() => saveCost(r.id)} className="btn btn-outline text-xs px-2 py-1">
                Save cost
              </button>
              {r.dateOut && (
                <span className="text-xs ml-auto" style={{ color: "var(--ink-muted)" }}>
                  Delivered {r.dateOut}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}