import { useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SectionHeader from "./SectionHeader.jsx";
import { fmtMoney } from "../lib/utils.js";

function lastSixMonths() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-IN", { month: "short" }) });
  }
  return months;
}

export default function Analytics({ sales, items, expenses, repairs }) {
  const months = useMemo(() => lastSixMonths(), []);

  const salesTrend = months.map(({ year, month, label }) => {
    const total = sales
      .filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, s) => sum + s.total, 0);
    return { label, sales: Math.round(total) };
  });

  const profitTrend = months.map(({ year, month, label }) => {
    const revenue = sales
      .filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, s) => sum + s.total, 0);
    const repairIncome = repairs
      .filter((r) => {
        if (!r.dateOut) return false;
        const d = new Date(r.dateOut);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, r) => sum + (r.cost || 0), 0);
    const spend = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, e) => sum + e.amount, 0);
    const purchaseCost = items
      .filter((i) => {
        const d = new Date(i.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, i) => sum + i.qty * i.costPrice, 0);
    return { label, income: Math.round(revenue + repairIncome), spend: Math.round(spend + purchaseCost) };
  });

  const totalIncome6mo = profitTrend.reduce((s, m) => s + m.income, 0);
  const totalSpend6mo = profitTrend.reduce((s, m) => s + m.spend, 0);

  return (
    <div>
      <SectionHeader title="Analytics" sub="Trends across the last 6 months" />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono" style={{ color: "var(--accent)" }}>
            {fmtMoney(totalIncome6mo)}
          </p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Total income (6 months) — sales + completed repairs
          </p>
        </div>
        <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6 }}>
          <p className="text-lg font-semibold mono" style={{ color: "var(--warn)" }}>
            {fmtMoney(totalSpend6mo)}
          </p>
          <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
            Total spend (6 months) — expenses + stock purchases
          </p>
        </div>
      </div>

      <p className="text-sm font-medium mb-2">Sales trend</p>
      <div className="p-4 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={salesTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" stroke="var(--ink-muted)" fontSize={12} />
            <YAxis stroke="var(--ink-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              formatter={(v) => fmtMoney(v)}
            />
            <Line type="monotone" dataKey="sales" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-sm font-medium mb-2">Income vs. spend</p>
      <div className="p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={profitTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" stroke="var(--ink-muted)" fontSize={12} />
            <YAxis stroke="var(--ink-muted)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }}
              formatter={(v) => fmtMoney(v)}
            />
            <Bar dataKey="income" fill="var(--accent)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="spend" fill="var(--warn)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}