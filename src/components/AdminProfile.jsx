import { useState, useEffect } from "react";
import { Check, AlertCircle, User } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { api } from "../lib/api.js";

export default function AdminProfile({ session }) {
  const [me, setMe] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api.getMe(session.username).then(setMe).catch(() => {});
  }, [session.username]);

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
    <div className="max-w-md">
      <SectionHeader title="My profile" sub="Your account details" />

      <div className="p-4 mb-4 flex items-center gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="w-12 h-12 rounded-full brand-badge flex items-center justify-center flex-shrink-0">
          <User size={20} color="#14161a" />
        </div>
        <div>
          <p className="text-sm font-medium">{me?.username || session.username}</p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            {me?.role === "admin" ? "Administrator" : me?.role || "…"}
          </p>
        </div>
      </div>

      <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Username</span>
          <span className="mono">{me?.username || "—"}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Email</span>
          <span className="mono">{me?.email || "—"}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Role</span>
          <span className="mono">{me?.role || "—"}</span>
        </div>
      </div>

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
          <button disabled={pwBusy} className="btn btn-accent px-3 py-2 text-sm">
            {pwBusy ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}