import { useState, useEffect } from "react";
import { LogOut, Cpu } from "lucide-react";
import { api } from "./lib/api.js";
import Login from "./components/Login.jsx";
import AdminApp from "./components/AdminApp.jsx";
import StaffApp from "./components/StaffApp.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState({});
  const [attendance, setAttendance] = useState({});
  const [items, setItems] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");

  async function refreshAll() {
    const [s, a, i, r] = await Promise.all([api.getStaff(), api.getAttendance(), api.getItems(), api.getRepairs()]);
    setStaff(s);
    setAttendance(a);
    setItems(i);
    setRepairs(r);
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshAll();
      } catch (e) {
        console.error("Failed to load data from server:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleLogin(newSession) {
    setSession(newSession);
    setTab(newSession.role === "admin" ? "dashboard" : "myattendance");
  }
  function handleLogout() {
    setSession(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p style={{ color: "var(--ink-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-3 row-line" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full brand-badge flex items-center justify-center">
            <Cpu size={14} color="#14161a" />
          </div>
          <span className="font-semibold text-sm">TECSC</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: "var(--ink-muted)" }}>
            {session.role === "admin" ? "Admin" : staff[session.staffId]?.name || session.username}
          </span>
          <button onClick={handleLogout} className="btn btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </header>

      {session.role === "admin" ? (
        <AdminApp
          tab={tab}
          setTab={setTab}
          staff={staff}
          attendance={attendance}
          items={items}
          repairs={repairs}
          refreshAll={refreshAll}
        />
      ) : (
        <StaffApp session={session} staff={staff} attendance={attendance} refreshAll={refreshAll} />
      )}
    </div>
  );
}