// Talks to the real backend (server/index.js) instead of the browser's
// localStorage, so data is shared across every device that can reach the
// server.

const API = "http://localhost:4000/api";

let currentActor = null;
export function setActor(username) {
  currentActor = username;
}

async function request(path, options) {
  const headers = { "Content-Type": "application/json" };
  if (currentActor) headers["X-Actor"] = currentActor;
  const res = await fetch(`${API}${path}`, {
    headers,
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const api = {
  getStaff: () => request("/staff"),
  createStaff: (payload) => request("/create-staff-login", { method: "POST", body: JSON.stringify(payload) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: "DELETE" }),

  getItems: () => request("/items"),
  addItem: (item) => request("/items", { method: "POST", body: JSON.stringify(item) }),
  updateItem: (id, updates) => request(`/items/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  deleteItem: (id) => request(`/items/${id}`, { method: "DELETE" }),

  getSales: () => request("/sales"),
  addSale: (sale) => request("/sales", { method: "POST", body: JSON.stringify(sale) }),

  getExpenses: () => request("/expenses"),
  addExpense: (expense) => request("/expenses", { method: "POST", body: JSON.stringify(expense) }),
  deleteExpense: (id) => request(`/expenses/${id}`, { method: "DELETE" }),

  getAttendance: () => request("/attendance"),
  setAttendance: (staffId, date, status) =>
    request("/attendance", { method: "POST", body: JSON.stringify({ staffId, date, status }) }),
  setAttendanceHours: (staffId, date, hours) =>
    request("/attendance-hours", { method: "POST", body: JSON.stringify({ staffId, date, hours }) }),

  getTimeLogs: () => request("/time-logs"),
  logTime: (staffId, type) => request("/time-log", { method: "POST", body: JSON.stringify({ staffId, type }) }),

  getRepairs: () => request("/repairs"),
  addRepair: (repair) => request("/repairs", { method: "POST", body: JSON.stringify(repair) }),
  updateRepair: (id, updates) => request(`/repairs/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
  trackRepairs: (phone) => request(`/track?phone=${encodeURIComponent(phone)}`),

  getSettings: () => request("/settings"),
  setSetting: (key, value) => request("/settings", { method: "POST", body: JSON.stringify({ key, value }) }),
  getMe: (username) => request(`/me?username=${encodeURIComponent(username)}`),
  changePassword: (username, currentPassword, newPassword) =>
    request("/change-password", { method: "POST", body: JSON.stringify({ username, currentPassword, newPassword }) }),

  getRentals: () => request("/rentals"),
  addRental: (rental) => request("/rentals", { method: "POST", body: JSON.stringify(rental) }),
  updateRental: (id, updates) => request(`/rentals/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  getBackupList: () => request("/backup-list"),
  restoreBackup: (data) => request("/restore", { method: "POST", body: JSON.stringify(data) }),

  getAuditLogs: () => request("/audit-logs"),
};