import { useState, useEffect } from "react";
import { History } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { api } from "../lib/api.js";

const ACTION_LABELS = {
  staff_created: "added a staff member",
  item_deleted: "deleted an inventory item",
  sale_recorded: "recorded a sale",
  expense_added: "added an expense",
  expense_deleted: "deleted an expense",
  setting_changed: "changed a setting",
  password_changed: "changed a password",
  attendance_marked: "set an attendance override",
  repair_added: "added a repair job",
  repair_updated: "updated a repair job",
  backup_restored: "restored a backup",
  rental_added: "added a rental",
  rental_updated: "updated a rental",
  staff_deleted: "removed a staff member",
  attendance_hours_set: "set manual hours for a day",
};

function fmtWhen(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Audit log" sub="Who changed what, most recent first (last 200 actions)" />
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        {loading && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            Loading…
          </p>
        )}
        {!loading && logs.length === 0 && (
          <p className="p-4 text-sm" style={{ color: "var(--ink-muted)" }}>
            No actions recorded yet.
          </p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3 row-line text-sm">
            <History size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--ink-muted)" }} />
            <div className="flex-1">
              <span className="font-medium">{log.actor || "system"}</span>{" "}
              <span style={{ color: "var(--ink-muted)" }}>{ACTION_LABELS[log.action] || log.action}</span>
              {log.details && (
                <span className="mono text-xs ml-1" style={{ color: "var(--ink-muted)" }}>
                  ({Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(", ")})
                </span>
              )}
            </div>
            <span className="text-xs mono flex-shrink-0" style={{ color: "var(--ink-muted)" }}>
              {fmtWhen(log.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
