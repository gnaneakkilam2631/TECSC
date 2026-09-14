import { useState, useRef, useEffect } from "react";
import { Search, User, Package, Wrench, Receipt, Laptop, X } from "lucide-react";

export default function GlobalSearch({ staff, items, repairs, sales, rentals, setTab }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const results = q.length < 2 ? [] : buildResults();

  function buildResults() {
    const out = [];
    for (const [id, s] of Object.entries(staff)) {
      if (s.name.toLowerCase().includes(q)) out.push({ type: "Staff", icon: User, label: s.name, tab: "staff" });
    }
    for (const i of items) {
      if (i.name.toLowerCase().includes(q)) out.push({ type: "Inventory", icon: Package, label: i.name, tab: "inventory" });
    }
    for (const r of repairs) {
      if (r.customerName?.toLowerCase().includes(q) || r.device?.toLowerCase().includes(q)) {
        out.push({ type: "Repair", icon: Wrench, label: `${r.customerName} — ${r.device}`, tab: "repairs" });
      }
    }
    for (const s of sales) {
      if (s.customerName?.toLowerCase().includes(q) || s.itemName?.toLowerCase().includes(q)) {
        out.push({ type: "Sale", icon: Receipt, label: `${s.itemName} → ${s.customerName || "walk-in"}`, tab: "billing" });
      }
    }
    for (const r of rentals) {
      if (r.customerName?.toLowerCase().includes(q) || r.itemName?.toLowerCase().includes(q)) {
        out.push({ type: "Rental", icon: Laptop, label: `${r.itemName} — ${r.customerName}`, tab: "rentals" });
      }
    }
    return out.slice(0, 12);
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--ink-muted)" }} />
        <input
          className="input pl-8 pr-7 py-1.5 text-sm w-40 md:w-56"
          placeholder="Search everything…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: "var(--ink-muted)" }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div
          className="absolute right-0 mt-1 w-72 max-h-80 overflow-y-auto py-1 z-50"
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
        >
          {results.length === 0 && (
            <p className="px-3 py-2 text-xs" style={{ color: "var(--ink-muted)" }}>
              No matches.
            </p>
          )}
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                setTab(r.tab);
                setOpen(false);
                setQuery("");
              }}
              className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-black/5"
              style={{ color: "var(--ink)" }}
            >
              <r.icon size={13} style={{ color: "var(--ink-muted)" }} />
              <span className="flex-1 truncate">{r.label}</span>
              <span className="text-xs" style={{ color: "var(--ink-muted)" }}>
                {r.type}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}