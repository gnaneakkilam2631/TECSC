import { useState, useEffect, useRef } from "react";
import { LogOut, Cpu, ChevronDown, Settings as SettingsIcon, User } from "lucide-react";
import { api } from "./lib/api.js";
import Login from "./components/Login.jsx";
import AdminApp from "./components/AdminApp.jsx";
import StaffApp from "./components/StaffApp.jsx";
import Settings from "./components/Settings.jsx";
import Profile from "./components/Profile.jsx";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState({});
  const [attendance, setAttendance] = useState({});
  const [timeLogs, setTimeLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [settings, setSettings] = useState({});
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  async function refreshAll() {
    const [s, a, tl, i, sa, ex, r, rent, set] = await Promise.all([
      api.getStaff(),
      api.getAttendance(),
      api.getTimeLogs(),
      api.getItems(),
      api.getSales(),
      api.getExpenses(),
      api.getRepairs(),
      api.getRentals(),
      api.getSettings(),
    ]);
    setStaff(s);
    setAttendance(a);
    setTimeLogs(tl);
    setItems(i);
    setSales(sa);
    setExpenses(ex);
    setRepairs(r);
    setRentals(rent);
    setSettings(set);
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

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogin(newSession) {
    setSession(newSession);
    setTab(newSession.role === "admin" ? "dashboard" : "myattendance");
  }
  function handleLogout() {
    setSession(null);
    setMenuOpen(false);
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

  const displayName = session.role === "admin" ? "Admin" : staff[session.staffId]?.name || session.username;
  const shopName = settings.shopName || "TECSC";
  const isSpecialView = tab === "settings" || tab === "profile";

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-5 py-3 row-line" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-2">
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full brand-badge flex items-center justify-center">
              <Cpu size={14} color="#14161a" />
            </div>
          )}
          <span className="font-semibold text-sm">{shopName}</span>
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-sm">
            <span style={{ color: "var(--ink-muted)" }}>{displayName}</span>
            <ChevronDown size={14} style={{ color: "var(--ink-muted)" }} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-44 py-1 z-10"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
            >
              <button
                onClick={() => {
                  setTab(session.role === "admin" ? "settings" : "profile");
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                style={{ color: "var(--ink)" }}
              >
                {session.role === "admin" ? <SettingsIcon size={14} /> : <User size={14} />}
                {session.role === "admin" ? "Settings" : "My profile"}
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 row-line"
                style={{ color: "var(--warn)" }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {isSpecialView ? (
        tab === "settings" ? (
          <div className="p-5">
            <Settings settings={settings} session={session} refreshAll={refreshAll} />
          </div>
        ) : (
          <Profile session={session} staff={staff} />
        )
      ) : session.role === "admin" ? (
        <AdminApp
          tab={tab}
          setTab={setTab}
          staff={staff}
          attendance={attendance}
          timeLogs={timeLogs}
          items={items}
          sales={sales}
          expenses={expenses}
          repairs={repairs}
          rentals={rentals}
          refreshAll={refreshAll}
        />
      ) : (
        <StaffApp session={session} staff={staff} attendance={attendance} timeLogs={timeLogs} refreshAll={refreshAll} />
      )}
    </div>
  );
}