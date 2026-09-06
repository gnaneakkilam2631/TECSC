import { useState } from "react";
import SectionHeader from "./SectionHeader.jsx";
import { todayISO, STATUS_META } from "../lib/utils.js";
import { api } from "../lib/api.js";

export default function AttendanceAdmin({ staff, attendance, refreshAll }) {
  const [date, setDate] = useState(todayISO());

  async function setStatus(staffId, status) {
    await api.setAttendance(staffId, date, status);
    await refreshAll();
  }

  const staffList = Object.entries(staff);

  return (
    <div>
      <SectionHeader title="Mark attendance" />
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
          return (
            <div key={id} className="flex items-center justify-between px-4 py-3 row-line text-sm">
              <span>{s.name}</span>
              <div className="flex gap-1">
                {Object.entries(STATUS_META).map(([key, meta]) => (
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
          );
        })}
      </div>
    </div>
  );
}