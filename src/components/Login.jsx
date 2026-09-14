import { useState, useEffect } from "react";
import { LogIn, Cpu, AlertCircle, CheckCircle2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api.js";

const API = "http://localhost:4000/api";

export default function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [forgotUsername, setForgotUsername] = useState("");
  const [resetForm, setResetForm] = useState({ code: "", newPassword: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const shopName = settings.shopName || "Trinadh Electronics & Computer Servicing Centre";

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed.");
        return;
      }
      onLogin(data);
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  async function handleForgotSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setInfo("If that account exists, a 6-digit code was sent to its email.");
      setMode("reset");
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const res = await fetch(`${API}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: forgotUsername, code: resetForm.code, newPassword: resetForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      setInfo("Password updated. You can sign in now.");
      setMode("login");
      setForm({ username: forgotUsername, password: "" });
    } catch (err) {
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 rounded-full brand-badge flex items-center justify-center mx-auto mb-4 overflow-hidden">
            {settings.logo ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Cpu size={36} color="#14161a" />
            )}
          </div>
          <h1 className="shine-text leading-tight" style={{ fontSize: "1.9rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {shopName}
          </h1>
          <p className="text-sm mt-2 tracking-wide" style={{ color: "var(--ink-muted)" }}>
            PURCHASES · ATTENDANCE · PAYROLL
          </p>
        </div>

        <div className="p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Username or email</label>
              <input
                className="input w-full px-3 py-2 mb-3 text-sm"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                autoFocus
              />
              <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Password</label>
              <div className="relative mb-2">
                <input
                  type={showPassword ? "text" : "password"}
                  className="input w-full px-3 py-2 pr-10 text-sm"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--ink-muted)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <button
                type="button"
                className="text-xs mb-4"
                style={{ color: "var(--ink-muted)" }}
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setInfo("");
                }}
              >
                Forgot password?
              </button>
              {error && (
                <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--warn)" }}>
                  <AlertCircle size={14} /> {error}
                </p>
              )}
              {info && (
                <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  <CheckCircle2 size={14} /> {info}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-accent w-full py-2.5 text-sm flex items-center justify-center gap-2">
                <LogIn size={15} /> {busy ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}

          {mode === "login" && (
            <a href="/track" className="block text-center text-xs mt-4" style={{ color: "var(--ink-muted)" }}>
              Track your repair status →
            </a>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotSubmit}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs mb-3 flex items-center gap-1"
                style={{ color: "var(--ink-muted)" }}
              >
                <ArrowLeft size={13} /> Back to sign in
              </button>
              <p className="text-sm mb-3" style={{ color: "var(--ink-muted)" }}>
                Enter your username or email and we'll email a 6-digit code to the address on file.
              </p>
              <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>Username or email</label>
              <input
                className="input w-full px-3 py-2 mb-4 text-sm"
                value={forgotUsername}
                onChange={(e) => setForgotUsername(e.target.value)}
                autoFocus
              />
              {error && (
                <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--warn)" }}>
                  <AlertCircle size={14} /> {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-accent w-full py-2 text-sm">
                {busy ? "Sending…" : "Send code"}
              </button>
            </form>
          )}

          {mode === "reset" && (
            <form onSubmit={handleResetSubmit}>
              <button
                type="button"
                onClick={() => setMode("login")}
                className="text-xs mb-3 flex items-center gap-1"
                style={{ color: "var(--ink-muted)" }}
              >
                <ArrowLeft size={13} /> Back to sign in
              </button>
              {info && (
                <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--accent)" }}>
                  <CheckCircle2 size={14} /> {info}
                </p>
              )}
              <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>6-digit code</label>
              <input
                className="input w-full px-3 py-2 mb-3 text-sm mono"
                value={resetForm.code}
                onChange={(e) => setResetForm({ ...resetForm, code: e.target.value })}
                maxLength={6}
                autoFocus
              />
              <label className="block text-sm mb-1" style={{ color: "var(--ink-muted)" }}>New password</label>
              <input
                type="password"
                className="input w-full px-3 py-2 mb-4 text-sm"
                value={resetForm.newPassword}
                onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
              />
              {error && (
                <p className="text-sm mb-3 flex items-center gap-1" style={{ color: "var(--warn)" }}>
                  <AlertCircle size={14} /> {error}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-accent w-full py-2 text-sm">
                {busy ? "Updating…" : "Update password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}