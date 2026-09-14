import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function StaffAdmin({ staff, refreshAll }) {
  const [form, setForm] = useState({
    name: "",
    baseSalary: "",
    paidLeaveQuota: 2,
    expectedHoursPerDay: 9,
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function addStaff(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.baseSalary || !form.username || !form.password) return;

    setBusy(true);
    try {
      await api.createStaff({
        username: form.username,
        password: form.password,
        staffId: uid("staff"),
        name: form.name,
        baseSalary: Number(form.baseSalary),
        paidLeaveQuota: Number(form.paidLeaveQuota),
        expectedHoursPerDay: Number(form.expectedHoursPerDay),
      });
      await refreshAll();
      setForm({ name: "", baseSalary: "", paidLeaveQuota: 2, expectedHoursPerDay: 9, username: "", password: "" });
    } catch (err) {
      setError(err.message || "Could not add staff.");
    } finally {
      setBusy(false);
    }
  }

  async function removeStaff(id) {
    await api.deleteStaff(id);
    setConfirmDelete(null);
    await refreshAll();
  }

  return (
    <div>
      <SectionHeader title="Staff" sub="Add staff, set their salary, expected hours, and leave allowance, and create their login" />
      <form
        onSubmit={addStaff}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-32" type="number" placeholder="Monthly salary" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" step="0.5" placeholder="Hours/day" value={form.expectedHoursPerDay} onChange={(e) => setForm({ ...form, expectedHoursPerDay: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" type="number" placeholder="Paid leaves/mo" value={form.paidLeaveQuota} onChange={(e) => setForm({ ...form, paidLeaveQuota: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-28" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={busy} className="btn btn-accent px-3 py-1.5 text-sm flex items-center gap-1">
          <Plus size={14} /> {busy ? "Adding…" : "Add staff"}
        </button>
      </form>
      {error && (
        <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
          {error}
        </p>
      )}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {Object.keys(staff).length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No staff added yet.
          </p>
        )}
        {Object.entries(staff).map(([id, s]) => (
          <div key={id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
            <span className="font-medium">{s.name}</span>
            <div className="flex items-center gap-3">
              <span className="mono" style={{ color: "var(--ink-muted)" }}>
                {fmtMoney(s.baseSalary)}/mo · {s.expectedHoursPerDay}h/day · {s.paidLeaveQuota} paid leaves
              </span>
              {confirmDelete === id ? (
                <span className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--warn)" }}>
                    Remove {s.name}?
                  </span>
                  <button onClick={() => removeStaff(id)} className="btn text-xs px-2 py-1" style={{ background: "var(--warn)", color: "#fff" }}>
                    Yes
                  </button>
                  <button onClick={() => setConfirmDelete(null)} className="btn btn-outline text-xs px-2 py-1">
                    Cancel
                  </button>
                </span>
              ) : (
                <button onClick={() => setConfirmDelete(id)} style={{ color: "var(--ink-muted)" }} title="Remove staff">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}