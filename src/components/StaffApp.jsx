import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, fmtHours, monthSummary, todayISO } from "../lib/utils.js";

export default function StaffApp({ session, staff, attendance }) {
  const person = staff[session.staffId];
  const now = new Date();

  if (!person) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        Your account isn't linked to a staff record. Ask the admin to check your setup.
      </div>
    );
  }

  const sum = monthSummary(attendance, staff, session.staffId, now.getFullYear(), now.getMonth());
  const todayEntry = attendance[`${session.staffId}:${todayISO()}`];

  return (
    <div className="max-w-md mx-auto p-5">
      <SectionHeader title={`Hi, ${person.name}`} sub={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="p-4 mb-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {todayEntry?.status === "present" && (
          <p className="text-sm" style={{ color: "var(--accent)" }}>
            Marked present today · {fmtHours(todayEntry.hours ?? person.expectedHoursPerDay)}
          </p>
        )}
        {todayEntry?.status === "absent" && (
          <p className="text-sm" style={{ color: "var(--warn)" }}>
            Marked absent today
          </p>
        )}
        {!todayEntry?.status && (
          <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
            Today's attendance hasn't been marked yet — your admin records this.
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Hours worked", value: fmtHours(sum.totalHoursWorked), color: "var(--accent)" },
          { label: "Days present", value: sum.present, color: "var(--accent)" },
          { label: "Days absent", value: sum.absent, color: "var(--warn)" },
        ].map((c) => (
          <div key={c.label} className="p-3 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
            <p className="text-lg font-semibold mono" style={{ color: c.color }}>
              {c.value}
            </p>
            <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-2">This month's salary</p>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Base salary</span>
          <span className="mono">{fmtMoney(person.baseSalary)}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Days marked so far</span>
          <span className="mono">{sum.daysMarked}</span>
        </div>
        <div className="flex justify-between text-sm py-1">
          <span style={{ color: "var(--ink-muted)" }}>Deduction</span>
          <span className="mono" style={{ color: sum.deduction > 0 ? "var(--warn)" : "var(--ink-muted)" }}>
            -{fmtMoney(sum.deduction)}
          </span>
        </div>
        <div className="flex justify-between text-sm py-1 font-medium row-line pb-2 mb-1">
          <span>Expected net pay</span>
          <span className="mono">{fmtMoney(sum.netSalary)}</span>
        </div>
        {sum.deduction > 0 && (
          <p className="text-xs mt-2" style={{ color: "var(--warn)" }}>
            Based on {sum.absent} absent day{sum.absent !== 1 ? "s" : ""}
            {sum.shortfallHours > 0 && ` and ${fmtHours(sum.shortfallHours)} short of expected hours on present days`}.
          </p>
        )}
      </div>
    </div>
  );
}