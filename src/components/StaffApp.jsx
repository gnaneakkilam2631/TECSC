import { useState, useEffect } from "react";
import { LogIn as ClockIn, LogOut as ClockOut, AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney, fmtHours, monthSummary, currentClockStatus, todaySessions } from "../lib/utils.js";
import { api } from "../lib/api.js";

function fmtTime(d) {
  return d ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function StaffApp({ session, staff, attendance, timeLogs, refreshAll }) {
  const person = staff[session.staffId];
  const [now, setNow] = useState(new Date());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (!person) {
    return (
      <div className="p-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        Your account isn't linked to a staff record. Ask the admin to check your setup.
      </div>
    );
  }

  const { status } = currentClockStatus(timeLogs, session.staffId);
  const sessions = todaySessions(timeLogs, session.staffId);
  const sum = monthSummary(attendance, timeLogs, staff, session.staffId, now.getFullYear(), now.getMonth());

  async function toggleClock() {
    setBusy(true);
    try {
      await api.logTime(session.staffId, status === "in" ? "out" : "in");
      await refreshAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-5">
      <SectionHeader title={`Hi, ${person.name}`} sub={now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="p-4 mb-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
          {status === "in" ? "You're currently clocked in" : "You're currently clocked out"}
        </p>
        <button
          onClick={toggleClock}
          disabled={busy}
          className="btn w-full py-3 text-sm flex items-center justify-center gap-2"
          style={status === "in" ? { border: "1px solid var(--warn)", color: "var(--warn)" } : {}}
        >
          {status === "in" ? (
            <>
              <ClockOut size={16} /> {busy ? "…" : "Clock out"}
            </>
          ) : (
            <span className="btn-accent w-full py-1 flex items-center justify-center gap-2 rounded">
              <ClockIn size={16} /> {busy ? "…" : "Clock in"}
            </span>
          )}
        </button>
        <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
          Clock out for lunch or when you step away, and clock back in when you return — every session today is tracked.
        </p>
      </div>

      {sessions.length > 0 && (
        <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-sm font-medium mb-2">Today's sessions</p>
          {sessions.map((s, i) => (
            <div key={i} className="flex justify-between text-sm py-1 mono">
              <span>{fmtTime(s.in)} → {s.out ? fmtTime(s.out) : "now"}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Hours worked", value: fmtHours(sum.totalHoursWorked), color: "var(--accent)" },
          { label: "Absent days", value: sum.absent, color: "var(--warn)" },
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
          <span style={{ color: "var(--ink-muted)" }}>Hours worked / expected so far</span>
          <span className="mono">
            {fmtHours(sum.totalHoursWorked)} / {fmtHours(sum.expectedHoursSoFar)}
          </span>
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
            Based on {fmtHours(sum.shortfallHours)} short of your expected hours this month
            {sum.absent > 0 && `, including ${sum.absent} day${sum.absent > 1 ? "s" : ""} with no clock-in`}
            {sum.unpaidLeaveDays > 0 && `, and ${sum.unpaidLeaveDays} leave day${sum.unpaidLeaveDays > 1 ? "s" : ""} beyond your quota`}.
          </p>
        )}
      </div>
    </div>
  );
}