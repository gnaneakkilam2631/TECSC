import { Users, Package, IndianRupee, AlertCircle, Circle } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, monthSummary, currentClockStatus } from "../lib/utils.js";

export default function Dashboard({ staff, items, attendance, timeLogs, repairs }) {
  const now = new Date();
  const staffList = Object.entries(staff);
  const totalInventoryValue = items.reduce((s, i) => s + i.qty * i.costPrice, 0);
  const totalDeductions = staffList.reduce(
    (sum, [id]) => sum + monthSummary(attendance, timeLogs, staff, id, now.getFullYear(), now.getMonth()).deduction,
    0
  );
  const openRepairs = (repairs || []).filter((r) => r.status !== "delivered").length;
  const clockedIn = staffList.filter(([id]) => currentClockStatus(timeLogs, id).status === "in");

  const cards = [
    { label: "Staff members", value: staffList.length, icon: Users },
    { label: "Items purchased (all time)", value: items.length, icon: Package },
    { label: "Inventory value", value: fmtMoney(totalInventoryValue), icon: IndianRupee, mono: true },
    { label: "Open repair jobs", value: openRepairs, icon: AlertCircle },
    { label: "This month's deductions", value: fmtMoney(totalDeductions), icon: AlertCircle, mono: true, warn: true },
  ];

  return (
    <div>
      <SectionHeader title="Dashboard" sub={now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })} />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <c.icon size={16} style={{ color: c.warn ? "var(--warn)" : "var(--accent)" }} />
            <p className={`text-lg font-semibold mt-2 ${c.mono ? "mono" : ""}`}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <SectionHeader title="Currently at work" />
      <div className="mb-6 p-4 flex flex-wrap gap-3" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {clockedIn.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            No one is currently clocked in.
          </p>
        ) : (
          clockedIn.map(([id, s]) => (
            <span key={id} className="text-sm flex items-center gap-1.5">
              <Circle size={8} fill="var(--accent)" style={{ color: "var(--accent)" }} />
              {s.name}
            </span>
          ))
        )}
      </div>

      <SectionHeader title="Staff this month" />
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {staffList.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No staff added yet — add someone from the Staff tab.
          </p>
        )}
        {staffList.map(([id, s]) => {
          const sum = monthSummary(attendance, timeLogs, staff, id, now.getFullYear(), now.getMonth());
          return (
            <div key={id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
              <span>{s.name}</span>
              <span className="mono" style={{ color: "var(--ink-muted)" }}>
                {sum.present} present · {sum.absent} absent · {sum.leave} leave
              </span>
              <span className="mono" style={{ color: sum.deduction > 0 ? "var(--warn)" : "var(--ink-muted)" }}>
                -{fmtMoney(sum.deduction)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}