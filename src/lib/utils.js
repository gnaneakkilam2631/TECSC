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

export const STATUS_META = {
  present: { label: "Present", color: "var(--accent)" },
  absent: { label: "Absent", color: "var(--warn)" },
  half: { label: "Half day", color: "var(--gold)" },
  leave: { label: "On leave", color: "var(--ink-muted)" },
};

const WORKING_DAYS_PER_MONTH = 30;

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

export function hoursWorkedOnDay(timeLogs, staffId, dateStr) {
  const dayLogs = timeLogs
    .filter((l) => l.staffId === staffId && dateKey(new Date(l.loggedAt)) === dateStr)
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

  let totalMs = 0;
  let openIn = null;
  for (const log of dayLogs) {
    if (log.type === "in") {
      openIn = new Date(log.loggedAt);
    } else if (log.type === "out" && openIn) {
      totalMs += new Date(log.loggedAt) - openIn;
      openIn = null;
    }
  }
  if (openIn && dateStr === todayISO()) {
    totalMs += new Date() - openIn;
  }
  return totalMs / (1000 * 60 * 60);
}

export function currentClockStatus(timeLogs, staffId) {
  const logs = timeLogs.filter((l) => l.staffId === staffId).sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
  if (logs.length === 0) return { status: "out", since: null };
  const last = logs[logs.length - 1];
  return { status: last.type === "in" ? "in" : "out", since: new Date(last.loggedAt) };
}

export function todaySessions(timeLogs, staffId) {
  const today = todayISO();
  const dayLogs = timeLogs
    .filter((l) => l.staffId === staffId && dateKey(new Date(l.loggedAt)) === today)
    .sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));

  const sessions = [];
  let openIn = null;
  for (const log of dayLogs) {
    if (log.type === "in") {
      openIn = new Date(log.loggedAt);
    } else if (log.type === "out") {
      sessions.push({ in: openIn, out: new Date(log.loggedAt) });
      openIn = null;
    }
  }
  if (openIn) sessions.push({ in: openIn, out: null });
  return sessions;
}

// Salary rule (fixed, as set by the shop):
//   1 day's salary  = monthly salary ÷ 30
//   1 hour's salary = that day's salary ÷ expected hours per day (default 9)
// A day with fewer hours worked than expected loses pay for the missing
// hours; a day with no clock-in at all loses a full day's pay. Admin can
// override either a full day's status, or just type exact hours worked.
export function monthSummary(attendance, timeLogs, staff, staffId, year, month) {
  const total = daysInMonth(year, month);
  const person = staff[staffId];
  const baseSalary = person?.baseSalary || 0;
  const quota = person?.paidLeaveQuota ?? 2;
  const expectedHours = person?.expectedHoursPerDay ?? 9;

  const dailyWage = baseSalary / WORKING_DAYS_PER_MONTH;
  const hourlyRate = expectedHours > 0 ? dailyWage / expectedHours : 0;

  let present = 0,
    absent = 0,
    half = 0,
    leave = 0,
    totalHoursWorked = 0,
    expectedHoursSoFar = 0,
    deduction = 0;

  const today = todayISO();
  const isPastOrToday = (dateStr) => dateStr <= today;

  for (let d = 1; d <= total; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isPastOrToday(dateStr)) continue;

    const entry = attendance[`${staffId}:${dateStr}`];
    const override = entry?.status || null;
    const hoursOverride = entry?.hours ?? null;

    if (override === "absent") {
      absent++;
      deduction += dailyWage;
      continue;
    }
    if (override === "half") {
      half++;
      deduction += dailyWage * 0.5;
      continue;
    }
    if (override === "leave") {
      leave++;
      continue;
    }
    if (override === "present") {
      present++;
      expectedHoursSoFar += expectedHours;
      continue;
    }

    // No full-day status override. If the admin manually entered exact
    // hours worked for this day, use that instead of the clock-in/out data.
    const hours = hoursOverride != null ? hoursOverride : hoursWorkedOnDay(timeLogs, staffId, dateStr);
    expectedHoursSoFar += expectedHours;
    totalHoursWorked += hours;
    if (hours <= 0) {
      absent++;
      deduction += dailyWage;
    } else {
      present++;
      const shortfall = Math.max(0, expectedHours - hours);
      deduction += shortfall * hourlyRate;
    }
  }

  const unpaidLeaveDays = Math.max(0, leave - quota);
  deduction += unpaidLeaveDays * dailyWage;

  return {
    total,
    present,
    absent,
    half,
    leave,
    quota,
    unpaidLeaveDays,
    totalHoursWorked,
    expectedHoursSoFar,
    shortfallHours: Math.max(0, expectedHoursSoFar - totalHoursWorked),
    dailyWage,
    hourlyRate,
    deduction,
    netSalary: baseSalary - deduction,
  };
}