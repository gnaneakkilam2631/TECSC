import { useState } from "react";
import { LogIn, Cpu, AlertCircle } from "lucide-react";

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
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-full brand-badge flex items-center justify-center mx-auto mb-3">
            <Cpu size={26} color="#14161a" />
          </div>
          <h1 className="text-xl font-semibold shine-text leading-tight">
            Trinadh Electronics &amp;<br />Computer Servicing Centre
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
            TECSC · Purchases, attendance &amp; payroll
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="p-5"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
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