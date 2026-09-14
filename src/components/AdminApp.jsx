import { IndianRupee, Package, Users, CalendarCheck, Wrench, Receipt, Wallet, BarChart3, Truck, Laptop, Settings as SettingsIcon, User, TrendingUp, History } from "lucide-react";
import Dashboard from "./Dashboard.jsx";
import Inventory from "./Inventory.jsx";
import StaffAdmin from "./StaffAdmin.jsx";
import AttendanceAdmin from "./AttendanceAdmin.jsx";
import SalaryReport from "./SalaryReport.jsx";
import RepairAdmin from "./RepairAdmin.jsx";
import Billing from "./Billing.jsx";
import Expenses from "./Expenses.jsx";
import Suppliers from "./Suppliers.jsx";
import Reports from "./Reports.jsx";
import Rentals from "./Rentals.jsx";
import Settings from "./Settings.jsx";
import AdminProfile from "./AdminProfile.jsx";
import Analytics from "./Analytics.jsx";
import AuditLog from "./AuditLog.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: IndianRupee },
  { id: "billing", label: "Billing", icon: Receipt },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "rentals", label: "Rentals", icon: Laptop },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "staff", label: "Staff", icon: Users },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "salary", label: "Salary", icon: IndianRupee },
  { id: "repairs", label: "Repairs", icon: Wrench },
  { id: "expenses", label: "Expenses", icon: Wallet },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "audit", label: "Audit Log", icon: History },
  { id: "profile", label: "Profile", icon: User },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function AdminApp({
  tab,
  setTab,
  staff,
  attendance,
  timeLogs,
  items,
  sales,
  expenses,
  repairs,
  rentals,
  settings,
  session,
  theme,
  setTheme,
  sidebarOpen,
  setSidebarOpen,
  refreshAll,
}) {
  function selectTab(id) {
    setTab(id);
  }

  return (
    <div className="relative">
      <nav
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-200 flex flex-col gap-1 p-3 w-64 fixed inset-y-0 left-0 z-40 overflow-y-auto`}
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectTab(t.id)}
              className="btn text-sm px-3 py-2 flex items-center gap-2 text-left"
              style={active ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } : { color: "var(--ink-muted)" }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>

      <main className={`${sidebarOpen ? "md:ml-64" : "ml-0"} transition-[margin] duration-200 p-5`}>
        {tab === "dashboard" && <Dashboard staff={staff} items={items} attendance={attendance} timeLogs={timeLogs} repairs={repairs} />}
        {tab === "billing" && <Billing items={items} sales={sales} refreshAll={refreshAll} />}
        {tab === "inventory" && <Inventory items={items} refreshAll={refreshAll} />}
        {tab === "rentals" && <Rentals rentals={rentals} refreshAll={refreshAll} />}
        {tab === "suppliers" && <Suppliers items={items} refreshAll={refreshAll} />}
        {tab === "staff" && <StaffAdmin staff={staff} refreshAll={refreshAll} />}
        {tab === "attendance" && <AttendanceAdmin staff={staff} attendance={attendance} timeLogs={timeLogs} refreshAll={refreshAll} />}
        {tab === "salary" && <SalaryReport staff={staff} attendance={attendance} timeLogs={timeLogs} />}
        {tab === "repairs" && <RepairAdmin repairs={repairs} refreshAll={refreshAll} />}
        {tab === "expenses" && <Expenses expenses={expenses} refreshAll={refreshAll} />}
        {tab === "analytics" && <Analytics sales={sales} items={items} expenses={expenses} repairs={repairs} />}
        {tab === "reports" && <Reports items={items} sales={sales} repairs={repairs} />}
        {tab === "audit" && <AuditLog />}
        {tab === "profile" && <AdminProfile session={session} />}
        {tab === "settings" && <Settings settings={settings} theme={theme} setTheme={setTheme} refreshAll={refreshAll} />}
      </main>
    </div>
  );
}