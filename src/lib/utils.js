export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function fmtMoney(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

export const STATUS_META = {
  present: { label: "Present", color: "var(--accent)" },
  absent: { label: "Absent", color: "var(--warn)" },
  half: { label: "Half day", color: "var(--gold)" },
  leave: { label: "On leave", color: "var(--ink-muted)" },
};

// Computes a staff member's attendance + pay summary for one calendar month.
// deduction = (absent days + half-days x 0.5 + unpaid leave beyond quota) x (base salary / days in month)
export function monthSummary(attendance, staff, staffId, year, month) {
  const total = daysInMonth(year, month);
  let present = 0,
    absent = 0,
    half = 0,
    leave = 0;

  for (let d = 1; d <= total; d++) {
    const key = `${staffId}:${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const st = attendance[key];
    if (st === "present") present++;
    else if (st === "absent") absent++;
    else if (st === "half") half++;
    else if (st === "leave") leave++;
  }

  const person = staff[staffId];
  const quota = person?.paidLeaveQuota ?? 2;
  const unpaidLeaveDays = Math.max(0, leave - quota);
  const effectiveAbsences = absent + unpaidLeaveDays + half * 0.5;
  const perDay = (person?.baseSalary || 0) / total;
  const deduction = effectiveAbsences * perDay;

  return {
    total,
    present,
    absent,
    half,
    leave,
    quota,
    unpaidLeaveDays,
    deduction,
    perDay,
    netSalary: (person?.baseSalary || 0) - deduction,
  };
}
