export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function fmtMoney(n) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function fmtHours(h) {
  return `${h.toFixed(1)}h`;
}

export function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

const WORKING_DAYS_PER_MONTH = 30;

// Salary rule (fixed, as set by the shop):
//   1 day's salary  = monthly salary ÷ 30
//   1 hour's salary = that day's salary ÷ expected hours per day (default 9)
// Attendance is entirely manual: for each day, the admin marks a staff
// member Present (with the exact hours they worked) or Absent. Any day the
// admin hasn't marked yet simply isn't counted — it doesn't count against
// or for the staff member until it's actually recorded.
export function monthSummary(attendance, staff, staffId, year, month) {
  const total = daysInMonth(year, month);
  const person = staff[staffId];
  const baseSalary = person?.baseSalary || 0;
  const expectedHours = person?.expectedHoursPerDay ?? 9;
  const joinedDate = person?.joinedDate || null;

  const dailyWage = baseSalary / WORKING_DAYS_PER_MONTH;
  const hourlyRate = expectedHours > 0 ? dailyWage / expectedHours : 0;

  let present = 0,
    absent = 0,
    totalHoursWorked = 0,
    expectedHoursSoFar = 0,
    deduction = 0,
    daysMarked = 0;

  for (let d = 1; d <= total; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (joinedDate && dateStr < joinedDate) continue;

    const entry = attendance[`${staffId}:${dateStr}`];
    if (!entry || !entry.status) continue; // not marked yet — doesn't count either way

    daysMarked++;

    if (entry.status === "absent") {
      absent++;
      deduction += dailyWage;
      continue;
    }

    // present
    const hours = entry.hours != null ? entry.hours : expectedHours;
    present++;
    expectedHoursSoFar += expectedHours;
    totalHoursWorked += hours;
    const shortfall = Math.max(0, expectedHours - hours);
    deduction += shortfall * hourlyRate;
  }

  return {
    total,
    daysMarked,
    present,
    absent,
    totalHoursWorked,
    expectedHoursSoFar,
    shortfallHours: Math.max(0, expectedHoursSoFar - totalHoursWorked),
    dailyWage,
    hourlyRate,
    deduction,
    netSalary: baseSalary - deduction,
  };
}