import { IndianRupee, Package, Users, CalendarCheck, Wrench, Receipt, Wallet, BarChart3, Truck, Laptop } from "lucide-react";
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
  { id: "reports", label: "Reports", icon: BarChart3 },
];

export default function AdminApp({ tab, setTab, staff, attendance, timeLogs, items, sales, expenses, repairs, rentals, refreshAll }) {
  return (
    <div className="flex flex-col md:flex-row">
      <nav
        className="flex flex-wrap md:flex-col gap-1 p-3 md:w-48 md:min-h-[calc(100vh-52px)] row-line md:border-b-0"
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
        {tab === "reports" && <Reports items={items} sales={sales} repairs={repairs} />}
      </main>
    </div>
  );
}