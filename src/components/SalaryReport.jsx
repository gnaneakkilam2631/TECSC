import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, fmtHours, monthSummary } from "../lib/utils.js";

export default function SalaryReport({ staff, attendance, timeLogs }) {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const label = new Date(ym.year, ym.month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  function shift(delta) {
    let m = ym.month + delta,
      y = ym.year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setYm({ year: y, month: m });
  }

  const staffList = Object.entries(staff);

  return (
    <div>
      <SectionHeader title="Salary report" sub="Pay is calculated from actual clocked hours, plus any admin overrides for leave/absence" />
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => shift(-1)} className="btn btn-outline p-1.5">
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm mono w-36 text-center">{label}</span>
        <button onClick={() => shift(1)} className="btn btn-outline p-1.5">
          <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <div className="grid grid-cols-6 gap-2 px-4 py-2 text-xs font-medium row-line" style={{ color: "var(--ink-muted)" }}>
          <span>Staff</span>
          <span>Base</span>
          <span>Hours worked</span>
          <span>Leave used</span>
          <span>Deduction</span>
          <span>Net pay</span>
        </div>
        {staffList.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No staff added yet.
          </p>
        )}
        {staffList.map(([id, s]) => {
          const sum = monthSummary(attendance, timeLogs, staff, id, ym.year, ym.month);
          return (
            <div key={id} className="grid grid-cols-6 gap-2 px-4 py-2 text-sm row-line items-center">
              <span>{s.name}</span>
              <span className="mono">{fmtMoney(s.baseSalary)}</span>
              <span className="mono">
                {fmtHours(sum.totalHoursWorked)}/{fmtHours(sum.expectedHoursSoFar)}
              </span>
              <span className="mono">
                {sum.leave}/{sum.quota}
              </span>
              <span className="mono" style={{ color: sum.deduction > 0 ? "var(--warn)" : "var(--ink-muted)" }}>
                -{fmtMoney(sum.deduction)}
              </span>
              <span className="mono font-medium">{fmtMoney(sum.netSalary)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--ink-muted)" }}>
        Deduction = shortfall between expected and clocked hours × hourly rate, plus full-day deductions for admin-marked
        absent/half days and unpaid leave beyond quota. Hourly rate = monthly salary ÷ (days in month × expected hours/day).
      </p>
    </div>
  );
}