import { Check, AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, todayISO, monthSummary, STATUS_META } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function StaffApp({ session, staff, attendance, refreshAll }) {
  const person = staff[session.staffId];
  const now = new Date();
  const today = todayISO();
  const todayKey = `${session.staffId}:${today}`;
  const alreadyMarked = attendance[todayKey];

  if (!person) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        Your account isn't linked to a staff record. Ask the admin to check your setup.
      </div>
    );
  }

  const sum = monthSummary(attendance, staff, session.staffId, now.getFullYear(), now.getMonth());

  function markToday() {
    api.setAttendance(session.staffId, today, "present").then(refreshAll);
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <SectionHeader title={`Hi, ${person.name}`} sub={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {alreadyMarked ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="dot" style={{ background: STATUS_META[alreadyMarked]?.color || "var(--ink-muted)" }} />
            Today marked as <strong>{STATUS_META[alreadyMarked]?.label || alreadyMarked}</strong>
          </div>
        ) : (
          <button onClick={markToday} className="btn btn-accent w-full py-2.5 text-sm flex items-center justify-center gap-2">
            <Check size={15} /> Mark today present
          </button>
        )}
        <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
          Other statuses (leave, half-day) are set by the admin.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Present", value: sum.present, color: "var(--accent)" },
          { label: "Absent", value: sum.absent, color: "var(--warn)" },
          { label: "Leave", value: `${sum.leave}/${sum.quota}`, color: "var(--ink-muted)" },
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
          <p className="text-xs flex items-start gap-1.5 mt-2" style={{ color: "var(--warn)" }}>
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            {sum.absent > 0 && `${sum.absent} unpaid absence${sum.absent > 1 ? "s" : ""}`}
            {sum.unpaidLeaveDays > 0 &&
              `${sum.absent > 0 ? ", " : ""}${sum.unpaidLeaveDays} leave day${sum.unpaidLeaveDays > 1 ? "s" : ""} beyond your ${sum.quota}-day quota`}
            {sum.half > 0 && `${sum.absent > 0 || sum.unpaidLeaveDays > 0 ? ", " : ""}${sum.half} half-day${sum.half > 1 ? "s" : ""}`}
            {" this month."}
          </p>
        )}
      </div>
    </div>
  );
}