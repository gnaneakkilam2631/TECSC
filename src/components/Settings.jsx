import { useState, useEffect } from "react";
import { Upload, Sun, Moon, Download, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { api } from "../lib/api.js";

const API_BASE = "http://localhost:4000/api";

export default function Settings({ settings, theme, setTheme, refreshAll }) {
  const [logoPreview, setLogoPreview] = useState(settings.logo || null);
  const [shopName, setShopName] = useState(settings.shopName || "Trinadh Electronics & Computer Servicing Centre");
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [backupList, setBackupList] = useState([]);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreConfirming, setRestoreConfirming] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");

  useEffect(() => {
    api.getBackupList().then(setBackupList).catch(() => {});
  }, []);

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setLogoPreview(dataUrl);
      setSavingLogo(true);
      try {
        await api.setSetting("logo", dataUrl);
        await refreshAll();
      } finally {
        setSavingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function saveShopName() {
    setSavingName(true);
    try {
      await api.setSetting("shopName", shopName);
      await refreshAll();
    } finally {
      setSavingName(false);
    }
  }

  function downloadBackup() {
    window.open(`${API_BASE}/backup`, "_blank");
  }

  function handleRestoreFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreConfirming(true);
    setRestoreMessage("");
  }

  async function confirmRestore() {
    if (!restoreFile) return;
    setRestoreBusy(true);
    setRestoreMessage("");
    try {
      const text = await restoreFile.text();
      const data = JSON.parse(text);
      await api.restoreBackup(data);
      setRestoreMessage("Restored successfully. Data has been replaced with the backup.");
      await refreshAll();
      const list = await api.getBackupList();
      setBackupList(list);
    } catch (err) {
      setRestoreMessage(err.message || "Restore failed — that file may not be a valid backup.");
    } finally {
      setRestoreBusy(false);
      setRestoreConfirming(false);
      setRestoreFile(null);
    }
  }

  return (
    <div className="max-w-lg">
      <SectionHeader title="Settings" sub="Logo, shop name, display, and backups" />

      <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-3">Logo</p>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                None
              </span>
            )}
          </div>
          <label className="btn btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer">
            <Upload size={13} /> {savingLogo ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
          </label>
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--ink-muted)" }}>
          Shows in the top navbar and on the login screen. A square image works best.
        </p>
      </div>

      <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-3">Shop name</p>
        <div className="flex gap-2">
          <input className="input flex-1 px-3 py-2 text-sm" value={shopName} onChange={(e) => setShopName(e.target.value)} />
          <button onClick={saveShopName} disabled={savingName} className="btn btn-accent px-3 py-2 text-sm">
            {savingName ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="p-4 mb-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-3">Display</p>
        <div className="flex gap-2">
          <button
            onClick={() => setTheme("light")}
            className="btn text-sm px-3 py-1.5 flex items-center gap-1.5"
            style={theme === "light" ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } : { border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setTheme("dark")}
            className="btn text-sm px-3 py-1.5 flex items-center gap-1.5"
            style={theme === "dark" ? { background: "var(--accent-soft)", color: "var(--accent-ink)" } : { border: "1px solid var(--border-strong)", color: "var(--ink-muted)" }}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-1 flex items-center gap-1.5">
          <ShieldCheck size={15} style={{ color: "var(--accent)" }} /> Backup & restore
        </p>
        <p className="text-xs mb-3" style={{ color: "var(--ink-muted)" }}>
          The server automatically saves a full backup once a day while it's running, kept in the{" "}
          <span className="mono">server/backups</span> folder. You can also download one on demand right now.
        </p>
        <button onClick={downloadBackup} className="btn btn-accent px-3 py-2 text-sm flex items-center gap-1.5 mb-4">
          <Download size={14} /> Download a full backup now
        </button>

        {backupList.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
              Automatic backups on this server:
            </p>
            <p className="text-xs mono" style={{ color: "var(--ink-muted)" }}>
              {backupList.slice(0, 5).join(", ")}
              {backupList.length > 5 && ` +${backupList.length - 5} more`}
            </p>
          </div>
        )}

        <div className="row-line pt-4">
          <p className="text-xs font-medium mb-2" style={{ color: "var(--warn)" }}>
            Restore from a backup file
          </p>
          <p className="text-xs mb-2" style={{ color: "var(--ink-muted)" }}>
            This replaces everything currently in the app with what's in the file. Only do this if you're sure.
          </p>
          <label className="btn btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer w-fit">
            <Upload size={13} /> Choose backup file
            <input type="file" accept="application/json" className="hidden" onChange={handleRestoreFileSelect} />
          </label>

          {restoreConfirming && (
            <div className="mt-3 p-3" style={{ background: "var(--warn-soft)", borderRadius: 6 }}>
              <p className="text-xs mb-2 flex items-center gap-1.5" style={{ color: "var(--warn)" }}>
                <AlertTriangle size={13} /> This will permanently replace all current data with "{restoreFile?.name}". This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={confirmRestore} disabled={restoreBusy} className="btn text-xs px-3 py-1.5" style={{ background: "var(--warn)", color: "#fff" }}>
                  {restoreBusy ? "Restoring…" : "Yes, replace all data"}
                </button>
                <button
                  onClick={() => {
                    setRestoreConfirming(false);
                    setRestoreFile(null);
                  }}
                  className="btn btn-outline text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {restoreMessage && (
            <p className="text-xs mt-2" style={{ color: restoreMessage.includes("failed") ? "var(--warn)" : "var(--accent)" }}>
              {restoreMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}