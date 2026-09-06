import { useState } from "react";
import { Plus } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, uid } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function StaffAdmin({ staff, refreshAll }) {
  const [form, setForm] = useState({ name: "", baseSalary: "", paidLeaveQuota: 2, username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      });
      await refreshAll();
      setForm({ name: "", baseSalary: "", paidLeaveQuota: 2, username: "", password: "" });
    } catch (err) {
      setError(err.message || "Could not add staff.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <SectionHeader title="Staff" sub="Add staff, set their salary and leave allowance, and create their login" />
      <form
        onSubmit={addStaff}
        className="flex flex-wrap gap-2 mb-2 p-4"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
      >
        <input className="input px-2 py-1.5 text-sm w-36" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="input px-2 py-1.5 text-sm w-32" type="number" placeholder="Monthly salary" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} />
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
            <span className="mono" style={{ color: "var(--ink-muted)" }}>
              {fmtMoney(s.baseSalary)}/mo · {s.paidLeaveQuota} paid leaves
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}