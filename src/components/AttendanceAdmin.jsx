import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { todayISO, STATUS_META, hoursWorkedOnDay, fmtHours } from "../lib/utils.js";
import { api } from "../lib/api.js";

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function AttendanceAdmin({ staff, attendance, timeLogs, refreshAll }) {
  const [date, setDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(null);

  async function setStatus(staffId, status) {
    const current = attendance[`${staffId}:${date}`];
    await api.setAttendance(staffId, date, current === status ? "" : status);
    await refreshAll();
  }

  const staffList = Object.entries(staff);

  return (
    <div>
      <SectionHeader
        title="Attendance overrides"
        sub="Staff clock themselves in and out from their own screen — use these only for planned leave, a full absence, or a half day. Click a selected status again to clear it and go back to their clock-in data."
      />
      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm" style={{ color: "var(--ink-muted)" }}>
          Date
        </label>
        <input type="date" className="input px-2 py-1.5 text-sm" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {staffList.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            Add staff first from the Staff tab.
          </p>
        )}
        {staffList.map(([id, s]) => {
          const current = attendance[`${id}:${date}`];
          const hours = hoursWorkedOnDay(timeLogs, id, date);
          const dayLogs = timeLogs
            .filter((l) => l.staffId === id && l.loggedAt.slice(0, 10) === date)
            .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
          const isOpen = expanded === id;

          return (
            <div key={id} className="row-line">
              <div className="flex items-center justify-between px-4 py-3 text-sm gap-2 flex-wrap">
                <button
                  onClick={() => setExpanded(isOpen ? null : id)}
                  className="flex items-center gap-1.5"
                  style={{ color: "var(--ink)" }}
                >
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {s.name}
                </button>
                <span className="text-xs mono" style={{ color: "var(--ink-muted)" }}>
                  {hours > 0 ? `${fmtHours(hours)} clocked` : "no clock-in"}
                </span>
                <div className="flex gap-1">
                  {Object.entries(STATUS_META)
                    .filter(([key]) => key !== "present")
                    .map(([key, meta]) => (
                      <button
                        key={key}
                        onClick={() => setStatus(id, key)}
                        className="btn text-xs px-2 py-1 flex items-center gap-1"
                        style={
                          current === key
                            ? { background: meta.color, color: "#fff" }
                            : { border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }
                        }
                      >
                        {meta.label}
                      </button>
                    ))}
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-3 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {dayLogs.length === 0 ? (
                    <p>No punches recorded for this date.</p>
                  ) : (
                    dayLogs.map((l) => (
                      <p key={l.id} className="mono">
                        {l.type === "in" ? "Clocked in" : "Clocked out"} at {fmtTime(l.loggedAt)}
                      </p>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}