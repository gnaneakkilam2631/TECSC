import { useState } from "react";
import { Trash2, UserPlus, Pencil, Check, X } from "lucide-react";
import { api } from "../lib/api.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function send(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "X-Actor": "admin" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);

export default function StaffAdmin({ staff = {}, refreshAll }) {
  const [form, setForm] = useState({
    name: "",
    baseSalary: "",
    paidLeaveQuota: "2",
    expectedHoursPerDay: "9",
    joinedDate: today(),
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || form.baseSalary === "") {
      setError("Please enter a name and monthly salary.");
      return;
    }
    setBusy(true);
    try {
      await send("POST", "/create-staff-login", {
        name: form.name.trim(),
        baseSalary: Number(form.baseSalary),
        paidLeaveQuota: Number(form.paidLeaveQuota || 2),
        expectedHoursPerDay: Number(form.expectedHoursPerDay || 9),
        joinedDate: form.joinedDate || today(),
      });
      setForm({ name: "", baseSalary: "", paidLeaveQuota: "2", expectedHoursPerDay: "9", joinedDate: today() });
      await refreshAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteStaff(id);
      setConfirmId(null);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveDate(id) {
    try {
      await send("PUT", `/staff/${id}`, { joinedDate: editDate });
      setEditId(null);
      await refreshAll();
    } catch (err) {
      setError(err.message);
    }
  }

  const list = Object.entries(staff);

  return (
    <div className="p-5 max-w-3xl">
      <h2 className="text-lg font-semibold mb-4">Staff</h2>

      <form
        onSubmit={handleAdd}
        className="p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
      >
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Name</label>
          <input
            className="input w-full px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Monthly salary</label>
          <input
            type="number"
            className="input w-full px-3 py-2 text-sm"
            value={form.baseSalary}
            onChange={(e) => setForm({ ...form, baseSalary: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Paid leave quota (days)</label>
          <input
            type="number"
            className="input w-full px-3 py-2 text-sm"
            value={form.paidLeaveQuota}
            onChange={(e) => setForm({ ...form, paidLeaveQuota: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Expected hours / day</label>
          <input
            type="number"
            className="input w-full px-3 py-2 text-sm"
            value={form.expectedHoursPerDay}
            onChange={(e) => setForm({ ...form, expectedHoursPerDay: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Joined on</label>
          <input
            type="date"
            className="input w-full px-3 py-2 text-sm"
            value={form.joinedDate}
            onChange={(e) => setForm({ ...form, joinedDate: e.target.value })}
          />
        </div>
        {error && (
          <p className="sm:col-span-2 text-sm" style={{ color: "var(--warn)" }}>{error}</p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="btn btn-accent px-4 py-2 text-sm flex items-center gap-2">
            <UserPlus size={15} /> {busy ? "Adding…" : "Add staff"}
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>No staff added yet.</p>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
          {list.map(([id, s], idx) => {
            const salary = s.baseSalary ?? s.base_salary ?? 0;
            const hours = s.expectedHoursPerDay ?? s.expected_hours_per_day ?? 9;
            const joined = (s.joinedDate ?? s.joined_date ?? "").toString().slice(0, 10);
            return (
              <div
                key={id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${idx > 0 ? "row-line" : ""}`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    ₹{salary}/month · {hours} hrs/day
                  </p>
                  {editId === id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="date"
                        className="input px-2 py-1 text-xs"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <button onClick={() => saveDate(id)} style={{ color: "var(--accent)" }}><Check size={15} /></button>
                      <button onClick={() => setEditId(null)} style={{ color: "var(--ink-muted)" }}><X size={15} /></button>
                    </div>
                  ) : (
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--ink-muted)" }}>
                      Joined: {joined || "—"}
                      <button
                        onClick={() => {
                          setEditId(id);
                          setEditDate(joined || today());
                        }}
                        title="Edit joined date"
                      >
                        <Pencil size={12} />
                      </button>
                    </p>
                  )}
                </div>

                {confirmId === id ? (
                  <div className="flex items-center gap-2 text-xs flex-shrink-0">
                    <span>Delete?</span>
                    <button onClick={() => handleDelete(id)} style={{ color: "var(--warn)" }}>Yes</button>
                    <button onClick={() => setConfirmId(null)} style={{ color: "var(--ink-muted)" }}>Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(id)}
                    style={{ color: "var(--warn)" }}
                    className="flex-shrink-0"
                    title="Delete staff"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}