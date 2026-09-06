import { IndianRupee, Package, Users, CalendarCheck, Wrench } from "lucide-react";
import Dashboard from "./Dashboard.jsx";
import Inventory from "./Inventory.jsx";
import StaffAdmin from "./StaffAdmin.jsx";
import AttendanceAdmin from "./AttendanceAdmin.jsx";
import SalaryReport from "./SalaryReport.jsx";
import RepairAdmin from "./RepairAdmin.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: IndianRupee },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "staff", label: "Staff", icon: Users },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "salary", label: "Salary", icon: IndianRupee },
  { id: "repairs", label: "Repairs", icon: Wrench },
];

export default function AdminApp({ tab, setTab, staff, attendance, items, repairs, refreshAll }) {
  return (
    <div className="flex flex-col md:flex-row">
      <nav
        className="flex md:flex-col gap-1 p-3 md:w-48 md:min-h-[calc(100vh-52px)] row-line md:border-b-0"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="btn text-sm px-3 py-2 flex items-center gap-2 text-left"
              style={active ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } : { color: "var(--ink-muted)" }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </nav>
      <main className="flex-1 p-5">
        {tab === "dashboard" && <Dashboard staff={staff} items={items} attendance={attendance} repairs={repairs} />}
        {tab === "inventory" && <Inventory items={items} refreshAll={refreshAll} />}
        {tab === "staff" && <StaffAdmin staff={staff} refreshAll={refreshAll} />}
        {tab === "attendance" && <AttendanceAdmin staff={staff} attendance={attendance} refreshAll={refreshAll} />}
        {tab === "salary" && <SalaryReport staff={staff} attendance={attendance} />}
        {tab === "repairs" && <RepairAdmin repairs={repairs} refreshAll={refreshAll} />}
      </main>
    </div>
  );
}