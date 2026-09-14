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
  const [hoursDrafts, setHoursDrafts] = useState({});

  async function setStatus(staffId, status) {
    const entry = attendance[`${staffId}:${date}`];
    const current = entry?.status;
    await api.setAttendance(staffId, date, current === status ? "" : status);
    await refreshAll();
  }

  async function saveHours(staffId) {
    const val = hoursDrafts[staffId];
    if (val === undefined || val === "") return;
    await api.setAttendanceHours(staffId, date, Number(val));
    setHoursDrafts({ ...hoursDrafts, [staffId]: "" });
    await refreshAll();
  }

  async function clearHours(staffId) {
    await api.setAttendanceHours(staffId, date, null);
    await refreshAll();
  }

  const staffList = Object.entries(staff);

  return (
    <div>
      <SectionHeader
        title="Attendance overrides"
        sub="Staff clock themselves in and out from their own screen. Use the status buttons for a full absence/leave/half-day, or type exact hours worked if they forgot to clock in/out or worked a partial day. Click a selected status again to clear it."
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
          const entry = attendance[`${id}:${date}`];
          const current = entry?.status;
          const manualHours = entry?.hours;
          const clockedHours = hoursWorkedOnDay(timeLogs, id, date);
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
                <span className="text-xs mono" style={{ color: manualHours != null ? "var(--gold)" : "var(--ink-muted)" }}>
                  {manualHours != null
                    ? `${fmtHours(manualHours)} (manual)`
                    : clockedHours > 0
                    ? `${fmtHours(clockedHours)} clocked`
                    : "no clock-in"}
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
              <div className="px-4 pb-3 flex items-center gap-2">
                <input
                  className="input px-2 py-1 text-xs w-28"
                  type="number"
                  step="0.5"
                  placeholder={manualHours != null ? `${manualHours}h set` : "Hours worked"}
                  value={hoursDrafts[id] ?? ""}
                  onChange={(e) => setHoursDrafts({ ...hoursDrafts, [id]: e.target.value })}
                />
                <button onClick={() => saveHours(id)} className="btn btn-outline text-xs px-2 py-1">
                  Save hours
                </button>
                {manualHours != null && (
                  <button onClick={() => clearHours(id)} className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    Clear
                  </button>
                )}
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