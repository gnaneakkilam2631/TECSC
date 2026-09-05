import { useState } from "react";
import { LogIn, IndianRupee, AlertCircle } from "lucide-react";

export default function Login({ users, onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const u = users[form.username];
    if (!u || u.password !== form.password) {
      setError("Incorrect username or password.");
      return;
    }
    setError("");
    onLogin({ username: form.username, role: u.role, staffId: u.staffId || null });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <IndianRupee size={16} color="#fff" />
            </div>
            <h1 className="text-lg font-semibold">Workbench</h1>
          </div>
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Shop records, attendance and payroll
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}
        >
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>
            Username
          </label>
          <input
            className="input w-full px-3 py-2 mb-3 text-sm"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            autoFocus
          />
          <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>
            Password
          </label>
          <input
            type="password"
            className="input w-full px-3 py-2 mb-4 text-sm"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && (
            <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--warn)" }}>
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <button type="submit" className="btn btn-accent w-full py-2 text-sm flex items-center justify-center gap-2">
            <LogIn size={15} /> Sign in
          </button>
          <p className="text-xs mt-3" style={{ color: "var(--ink-muted)" }}>
            First time? Sign in as <span className="mono">admin</span> / <span className="mono">admin123</span>, then
            change it and add staff logins from the Staff tab.
          </p>
        </form>
      </div>
    </div>
  );
}
