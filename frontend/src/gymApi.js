import { api } from "./apiClient.js";

export const membersApi = {
  list: () => api.get("/api/members"),
  create: (payload) => api.post("/api/members", payload),
  update: (id, payload) => api.put(`/api/members/${id}`, payload),
  remove: (id) => api.delete(`/api/members/${id}`),
  updateMembership: (id, payload) => api.put(`/api/members/${id}/membership`, payload),
  toggleSuspend: (id) => api.post(`/api/members/${id}/suspend`),
};

export const plansApi = {
  list: () => api.get("/api/plans"),
  save: (payload) => api.post("/api/plans", payload),
  remove: (id) => api.delete(`/api/plans/${id}`),
};

export const financeApi = {
  summary: () => api.get("/api/finance/summary"),
  registerPayment: (payload) => api.post("/api/finance/payments", payload),
  registerExpense: (payload) => api.post("/api/finance/expenses", payload),
};

export const inventoryApi = {
  list: () => api.get("/api/products"),
  save: (payload) => api.post("/api/products", payload),
  updateStock: (id, stock) => api.put(`/api/products/${id}/stock`, { stock }),
  remove: (id) => api.delete(`/api/products/${id}`),
};

export const classesApi = {
  listTemplates: () => api.get("/api/classes/templates"),
  saveTemplate: (payload) => api.post("/api/classes/templates", payload),
  removeTemplate: (id) => api.delete(`/api/classes/templates/${id}`),
  list: () => api.get("/api/classes"),
  create: (payload) => api.post("/api/classes", payload),
  remove: (id) => api.delete(`/api/classes/${id}`),
  reserve: (payload) => api.post("/api/classes/reservations", payload),
  cancelReservation: (id) => api.post(`/api/classes/reservations/${id}/cancel`),
};

export const progressApi = {
  all: () => api.get("/api/progress"),
  addRecord: (payload) => api.post("/api/progress/records", payload),
  addGoal: (payload) => api.post("/api/progress/goals", payload),
  toggleGoal: (id) => api.post(`/api/progress/goals/${id}/toggle`),
  addNote: (payload) => api.post("/api/progress/notes", payload),
};

export const operationsApi = {
  all: () => api.get("/api/operations"),
  saveBudget: (payload) => api.put("/api/operations/budgets", payload),
  saveEquipment: (payload) => api.post("/api/operations/equipment", payload),
  updateEquipmentStatus: (id, status) => api.put(`/api/operations/equipment/${id}/status`, { status }),
  removeEquipment: (id) => api.delete(`/api/operations/equipment/${id}`),
  createShift: (payload) => api.post("/api/operations/shifts", payload),
  removeShift: (id) => api.delete(`/api/operations/shifts/${id}`),
};

export const staffApi = {
  list: () => api.get("/api/staff"),
  create: (payload) => api.post("/api/staff", payload),
  toggle: (id) => api.post(`/api/staff/${id}/toggle`),
};

export const gymProfileApi = {
  get: () => api.get("/api/gym"),
  update: (payload) => api.put("/api/gym", payload),
};

// The gym's own SaaS subscription and invoices (read-only; the platform issues them).
export const billingApi = {
  get: () => api.get("/api/billing"),
};

export const checkInApi = {
  recent: (take = 25) => api.get(`/api/check-ins/recent?take=${take}`),
  checkIn: (memberId) => api.post("/api/check-ins", { memberId }),
  checkOut: (memberId) => api.post("/api/check-ins/check-out", { memberId }),
};
