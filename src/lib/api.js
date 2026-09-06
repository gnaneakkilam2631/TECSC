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
  deleteItem: (id) => request(`/items/${id}`, { method: "DELETE" }),

  getAttendance: () => request("/attendance"),
  setAttendance: (staffId, date, status) =>
    request("/attendance", { method: "POST", body: JSON.stringify({ staffId, date, status }) }),

  getRepairs: () => request("/repairs"),
  addRepair: (repair) => request("/repairs", { method: "POST", body: JSON.stringify(repair) }),
  updateRepair: (id, updates) => request(`/repairs/${id}`, { method: "PUT", body: JSON.stringify(updates) }),
};