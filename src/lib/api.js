const API = "http://localhost:4000/api";

async function request(path, options) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export const api = {
  getStaff: () => request("/staff"),
  createStaff: (payload) => request("/create-staff-login", { method: "POST", body: JSON.stringify(payload) }),

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

  getTimeLogs: () => request("/time-logs"),
  logTime: (staffId, type) => request("/time-log", { method: "POST", body: JSON.stringify({ staffId, type }) }),

  getRepairs: () => request("/repairs"),
  addRepair: (repair) => request("/repairs", { method: "POST", body: JSON.stringify(repair) }),
  updateRepair: (id, updates) => request(`/repairs/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
};