import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function Profile({ session, staff }) {
  const person = staff[session.staffId];
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!pwForm.currentPassword || !pwForm.newPassword) return;
    setPwBusy(true);
    try {
      await api.changePassword(session.username, pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.message || "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <SectionHeader title="My profile" />

      {person && (
        <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--ink-muted)" }}>Name</span>
            <span>{person.name}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--ink-muted)" }}>Monthly salary</span>
            <span className="mono">{fmtMoney(person.baseSalary)}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--ink-muted)" }}>Expected hours/day</span>
            <span className="mono">{person.expectedHoursPerDay}h</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span style={{ color: "var(--ink-muted)" }}>Paid leaves/month</span>
            <span className="mono">{person.paidLeaveQuota}</span>
          </div>
        </div>
      )}

      <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-3">Change your password</p>
        <form onSubmit={changePassword}>
          <label className="block text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
            Current password
          </label>
          <input
            type="password"
            className="input w-full px-3 py-2 mb-3 text-sm"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <label className="block text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
            New password
          </label>
          <input
            type="password"
            className="input w-full px-3 py-2 mb-3 text-sm"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          {pwError && (
            <p className="text-sm mb-2 flex items-center gap-1" style={{ color: "var(--warn)" }}>
              <AlertCircle size={14} /> {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-sm mb-2 flex items-center gap-1" style={{ color: "var(--accent)" }}>
              <Check size={14} /> {pwSuccess}
            </p>
          )}
          <button disabled={pwBusy} className="btn btn-accent w-full py-2 text-sm">
            {pwBusy ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}