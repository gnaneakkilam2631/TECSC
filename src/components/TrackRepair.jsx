import { useState } from "react";
import { Search, ArrowLeft, Cpu } from "lucide-react";
import { fmtMoney } from "../lib/utils.js";
import { api } from "../lib/api.js";

const STATUS_LABEL = {
  received: "Received — waiting to be looked at",
  "in progress": "In progress",
  "waiting on part": "Waiting on a part",
  completed: "Ready for pickup!",
  delivered: "Delivered",
};

export default function TrackRepair() {
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const data = await api.trackRepairs(phone.trim());
      setResults(data);
    } catch (err) {
      setError("Couldn't look that up right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <a href="/" className="text-xs mb-4 flex items-center gap-1" style={{ color: "var(--ink-muted)" }}>
          <ArrowLeft size={13} /> Back to login
        </a>
        <div className="mb-6 text-center">
          <div className="w-14 h-14 rounded-full brand-badge flex items-center justify-center mx-auto mb-3">
            <Cpu size={26} color="#14161a" />
          </div>
          <h1 className="text-xl font-semibold">Track your repair</h1>
          <p className="text-sm mt-1" style={{ color: "var(--ink-muted)" }}>
            Enter the phone number you gave us when you dropped off your device
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="p-5 mb-4 flex gap-2"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}
        >
          <input
            className="input flex-1 px-3 py-2 text-sm"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <button disabled={busy} className="btn btn-accent px-3 py-2 text-sm flex items-center gap-1.5">
            <Search size={14} /> {busy ? "…" : "Look up"}
          </button>
        </form>

        {error && (
          <p className="text-sm mb-3" style={{ color: "var(--warn)" }}>
            {error}
          </p>
        )}

        {results && results.length === 0 && (
          <p className="text-sm text-center" style={{ color: "var(--ink-muted)" }}>
            No repairs found for that number.
          </p>
        )}

        {results && results.length > 0 && (
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
                <p className="text-sm font-medium">{r.device}</p>
                {r.issue && (
                  <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                    {r.issue}
                  </p>
                )}
                <p className="text-sm mt-2 font-medium" style={{ color: r.status === "completed" ? "var(--accent)" : "var(--ink)" }}>
                  {STATUS_LABEL[r.status] || r.status}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                  Dropped off {r.dateIn}
                  {r.dateOut && ` · Delivered ${r.dateOut}`}
                </p>
                {r.cost != null && (
                  <p className="text-xs mt-1 mono" style={{ color: "var(--ink-muted)" }}>
                    Cost: {fmtMoney(r.cost)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}