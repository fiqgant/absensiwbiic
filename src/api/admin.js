import { api } from "./client";

export const loginAdmin = (email, password) =>
  api
    .post(
      "/api/admin/login",
      { email, password },
      { dedupeKey: "POST:/api/admin/login", timeout: 12000 }
    )
    .then((r) => r.data);

export const me = () =>
  api
    .get("/api/admin/me", { dedupeKey: "GET:/api/admin/me", timeout: 10000 })
    .then((r) => r.data);

export const listLocations = () =>
  api
    .get("/api/admin/locations", {
      dedupeKey: "GET:/api/admin/locations",
      timeout: 12000,
    })
    .then((r) => r.data.locations);

export const createLocation = (payload) =>
  api
    .post("/api/admin/locations", payload, {
      dedupeKey: "POST:/api/admin/locations",
      timeout: 12000,
    })
    .then((r) => r.data.location);

export const updateLocation = (id, payload) =>
  api
    .patch(`/api/admin/locations/${id}`, payload, {
      dedupeKey: `PATCH:/api/admin/locations/${id}`,
      timeout: 12000,
    })
    .then((r) => r.data.location);

export const deleteLocation = (id) =>
  api
    .delete(`/api/admin/locations/${id}`, {
      dedupeKey: `DELETE:/api/admin/locations/${id}`,
      timeout: 12000,
    })
    .then((r) => r.data);

export const getDailyCompare = () =>
  api
    .get("/api/admin/list", {
      dedupeKey: "GET:/api/admin/list",
      timeout: 12000,
    })
    .then((r) => r.data);

export const fetchList = () =>
  api
    .get("/api/admin/list", {
      dedupeKey: "GET:/api/admin/list",
      timeout: 12000,
    })
    .then((r) => r.data);

export const fetchAttendanceAll = ({ date_from, date_to, max = 20000 }) =>
  api
    .get("/api/admin/attendance-all", {
      params: { date_from, date_to, max },
      dedupeKey: `GET:/api/admin/attendance-all:${date_from}:${date_to}:${max}`,
      timeout: 30000,
    })
    .then((r) => ({ rows: r.data?.rows ?? [] }));

export const exportRange = ({ date_from, date_to }) =>
  api
    .get("/api/admin/export-range", {
      params: { date_from, date_to },
      responseType: "blob",
      dedupeKey: `GET:/api/admin/export-range:${date_from}:${date_to}`,
      timeout: 60000,
    })
    .then((r) => r.data);

export const patchAttendance = (id, payload) =>
  api
    .patch(`/api/admin/attendance/${id}`, payload, {
      dedupeKey: `PATCH:/api/admin/attendance/${id}`,
      timeout: 12000,
    })
    .then((r) => r.data.attendance);

export const deleteAttendance = (id) =>
  api
    .delete(`/api/admin/attendance/${id}`, {
      dedupeKey: `DELETE:/api/admin/attendance/${id}`,
      timeout: 12000,
    })
    .then((r) => r.data);
