import { useState } from "react";
import { Upload, Check, AlertCircle } from "lucide-react";
import SectionHeader from "./SectionHeader.jsx";
import { api } from "../lib/api.js";

export default function Settings({ settings, session, refreshAll }) {
  const [logoPreview, setLogoPreview] = useState(settings.logo || null);
  const [shopName, setShopName] = useState(settings.shopName || "Trinadh Electronics & Computer Servicing Centre");
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

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

  async function changePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!pwForm.currentPassword || !pwForm.newPassword) return;
    setPwBusy(true);
    try {
      await api.changePassword(session.username, pwForm.currentPassword, pwForm.newPassword);
      setPwSuccess("Password changed.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.message || "Could not change password.");
    } finally {
      setPwBusy(false);
    }
  }

  return (
    <div className="max-w-lg">
      <SectionHeader title="Settings" sub="Logo, shop name, and your login" />

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

      <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
        <p className="text-sm font-medium mb-3">Change your password</p>
        <form onSubmit={changePassword}>
          <label className="block text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
            Current password
          </label>
          <input
            type="password"
            className="input w-full px-3 py-2 mb-3 text-sm"
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
          />
          <label className="block text-xs mb-1" style={{ color: "var(--ink-muted)" }}>
            New password
          </label>
          <input
            type="password"
            className="input w-full px-3 py-2 mb-3 text-sm"
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
          />
          {pwError && (
            <p className="text-sm mb-2 flex items-center gap-1" style={{ color: "var(--warn)" }}>
              <AlertCircle size={14} /> {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-sm mb-2 flex items-center gap-1" style={{ color: "var(--accent)" }}>
              <Check size={14} /> {pwSuccess}
            </p>
          )}
          <button disabled={pwBusy} className="btn btn-accent px-3 py-2 text-sm">
            {pwBusy ? "Updating…" : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}