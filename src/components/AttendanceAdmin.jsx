import { useState } from "react";
import { Check, X } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { todayISO, fmtHours } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function AttendanceAdmin({ staff, attendance, refreshAll }) {
  const [date, setDate] = useState(todayISO());
  const [hoursDrafts, setHoursDrafts] = useState({});

  async function markPresent(staffId, defaultHours) {
    const draft = hoursDrafts[staffId];
    const hours = draft !== undefined && draft !== "" ? Number(draft) : defaultHours;
    await api.setAttendance(staffId, date, "present", hours);
    await refreshAll();
  }

  async function markAbsent(staffId) {
    await api.setAttendance(staffId, date, "absent");
    await refreshAll();
  }

  async function clearDay(staffId) {
    await api.setAttendance(staffId, date, "");
    await refreshAll();
  }

  const staffList = Object.entries(staff);

  return (
    <div>
      <SectionHeader
        title="Attendance"
        sub="Mark each staff member Present (with hours worked) or Absent for the selected date. This is the only source of attendance — nothing is assumed automatically."
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
          const status = entry?.status;
          const expectedHours = s.expectedHoursPerDay ?? 9;

          return (
            <div key={id} className="flex items-center justify-between px-4 py-3 row-line text-sm gap-2 flex-wrap">
              <span className="min-w-[100px]">{s.name}</span>

              {status === "present" && (
                <span className="text-xs mono" style={{ color: "var(--accent)" }}>
                  Present · {fmtHours(entry.hours ?? expectedHours)}
                </span>
              )}
              {status === "absent" && (
                <span className="text-xs mono" style={{ color: "var(--warn)" }}>
                  Absent
                </span>
              )}
              {!status && (
                <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Not marked yet
                </span>
              )}

              <div className="flex items-center gap-2">
                <input
                  className="input px-2 py-1 text-xs w-20"
                  type="number"
                  step="0.5"
                  placeholder={`${expectedHours}h`}
                  value={hoursDrafts[id] ?? ""}
                  onChange={(e) => setHoursDrafts({ ...hoursDrafts, [id]: e.target.value })}
                />
                <button
                  onClick={() => markPresent(id, expectedHours)}
                  className="btn text-xs px-2 py-1 flex items-center gap-1"
                  style={
                    status === "present"
                      ? { background: "var(--accent)", color: "#fff" }
                      : { border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }
                  }
                >
                  <Check size={12} /> Present
                </button>
                <button
                  onClick={() => markAbsent(id)}
                  className="btn text-xs px-2 py-1 flex items-center gap-1"
                  style={
                    status === "absent"
                      ? { background: "var(--warn)", color: "#fff" }
                      : { border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }
                  }
                >
                  <X size={12} /> Absent
                </button>
                {status && (
                  <button onClick={() => clearDay(id)} className="text-xs" style={{ color: "var(--ink-muted)" }}>
                    Clear
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}