import { api } from "./client";

export const loginAdmin = (email, password) =>
  api.post("/api/admin/login", { email, password }).then((r) => r.data);

export const me = () => api.get("/api/admin/me").then((r) => r.data);

export const listLocations = () =>
  api.get("/api/admin/locations").then((r) => r.data.locations);

export const createLocation = (payload) =>
  api.post("/api/admin/locations", payload).then((r) => r.data.location);

export const updateLocation = (id, payload) =>
  api.patch(`/api/admin/locations/${id}`, payload).then((r) => r.data.location);

export const deleteLocation = (id) =>
  api.delete(`/api/admin/locations/${id}`).then((r) => r.data);

export const getDailyCompare = () =>
  api.get("/api/admin/list").then((r) => r.data);

export const fetchList = () => api.get("/api/admin/list").then((r) => r.data);

export const fetchAttendanceAll = ({ date_from, date_to, max = 20000 }) =>
  api
    .get("/api/admin/attendance-all", {
      params: { date_from, date_to, max },
    })
    .then((r) => ({ rows: r.data?.rows ?? [] }));

export const exportRange = ({ date_from, date_to }) =>
  api
    .get("/api/admin/export-range", {
      params: { date_from, date_to },
      responseType: "blob",
    })
    .then((r) => r.data);

export const patchAttendance = (id, payload) =>
  api
    .patch(`/api/admin/attendance/${id}`, payload)
    .then((r) => r.data.attendance);

export const deleteAttendance = (id) =>
  api.delete(`/api/admin/attendance/${id}`).then((r) => r.data);
