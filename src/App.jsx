import { useState, useEffect } from "react";
import { LogOut, Cpu } from "lucide-react";
import { storeGet, storeSet } from "./lib/storage.js";
import Login from "./components/Login.jsx";
import AdminApp from "./components/AdminApp.jsx";
import StaffApp from "./components/StaffApp.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaffState] = useState({});
  const [attendance, setAttendanceState] = useState({});
  const [items, setItemsState] = useState([]);
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    (async () => {
      setStaffState(await storeGet("staff", {}));
      setAttendanceState(await storeGet("attendance", {}));
      setItemsState(await storeGet("items", []));
      setLoading(false);
    })();
  }, []);

  async function setStaff(next) {
    setStaffState(next);
    await storeSet("staff", next);
  }
  async function setAttendance(next) {
    setAttendanceState(next);
    await storeSet("attendance", next);
  }
  async function setItems(next) {
    setItemsState(next);
    await storeSet("items", next);
  }

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
          setStaff={setStaff}
          attendance={attendance}
          setAttendance={setAttendance}
          items={items}
          setItems={setItems}
        />
      ) : (
        <StaffApp session={session} staff={staff} attendance={attendance} setAttendance={setAttendance} />
      )}
    </div>
  );
}