import { useState, useEffect, useRef } from "react";
import { LogOut, Cpu, ChevronDown, User, Sun, Moon, Menu } from "lucide-react";
import { api, setActor } from "./lib/api.js";
import Login from "./components/Login.jsx";
import AdminApp from "./components/AdminApp.jsx";
import StaffApp from "./components/StaffApp.jsx";
import Profile from "./components/Profile.jsx";
import TrackRepair from "./components/TrackRepair.jsx";
import GlobalSearch from "./components/GlobalSearch.jsx";

export default function App() {
  const isTrackPage = window.location.pathname.startsWith("/track");

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [serverError, setServerError] = useState(false);
  const menuRef = useRef(null);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function refreshAll() {
    try {
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
      setServerError(false);
    } catch (e) {
      setServerError(true);
      throw e;
    }
  }

  useEffect(() => {
    if (isTrackPage) {
      setLoading(false);
      return;
    }
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

  useEffect(() => {
    if (!serverError) return;
    const retry = setInterval(() => {
      refreshAll().catch(() => {});
    }, 10000);
    return () => clearInterval(retry);
  }, [serverError]);

  function handleLogin(newSession) {
    setSession(newSession);
    setActor(newSession.username);
    setTab(newSession.role === "admin" ? "dashboard" : "myattendance");
  }
  function handleLogout() {
    setSession(null);
    setActor(null);
    setMenuOpen(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p style={{ color: "var(--ink-muted)" }}>Loading…</p>
      </div>
    );
  }

  if (isTrackPage) {
    return <TrackRepair />;
  }

  if (!session) {
    return <Login onLogin={handleLogin} />;
  }

  const displayName = session.role === "admin" ? "Admin" : staff[session.staffId]?.name || session.username;
  const shopName = settings.shopName || "TECSC";
  const showStaffProfile = session.role === "staff" && tab === "profile";

  return (
    <div className="min-h-screen">
      {serverError && (
        <div className="px-4 py-2 text-center text-xs font-medium" style={{ background: "var(--warn)", color: "#fff" }}>
          Can't reach the server — recent changes may not be saved. Check that the backend is running, then refresh.
        </div>
      )}
      <header className="flex items-center justify-between px-5 py-3 row-line gap-3" style={{ background: "var(--surface)" }}>
        <div className="flex items-center gap-3 flex-shrink-0">
          {session.role === "admin" && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: "var(--ink)" }}>
              <Menu size={20} />
            </button>
          )}
          {settings.logo ? (
            <img src={settings.logo} alt="Logo" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full brand-badge flex items-center justify-center">
              <Cpu size={14} color="#14161a" />
            </div>
          )}
          <span className="font-semibold text-sm hidden sm:inline">{shopName}</span>
        </div>

        {session.role === "admin" && (
          <GlobalSearch staff={staff} items={items} repairs={repairs} sales={sales} rentals={rentals} setTab={setTab} />
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          <button onClick={toggleTheme} className="btn btn-outline p-1.5" title="Toggle light/dark">
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 text-sm">
              <span style={{ color: "var(--ink-muted)" }} className="hidden sm:inline">{displayName}</span>
              <ChevronDown size={14} style={{ color: "var(--ink-muted)" }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-44 py-1 z-50"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
              >
                <button
                  onClick={() => {
                    setTab("profile");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm flex items-center gap-2"
                  style={{ color: "var(--ink)" }}
                >
                  <User size={14} />
                  My profile
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
        </div>
      </header>

      {session.role === "admin" ? (
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
          settings={settings}
          session={session}
          theme={theme}
          setTheme={setTheme}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          refreshAll={refreshAll}
        />
      ) : showStaffProfile ? (
        <Profile session={session} staff={staff} onBack={() => setTab("myattendance")} />
      ) : (
        <StaffApp session={session} staff={staff} attendance={attendance} timeLogs={timeLogs} refreshAll={refreshAll} />
      )}
    </div>
  );
}