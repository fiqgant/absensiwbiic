import { api } from "./client";

export const getLocationsPublic = () =>
  api.get("/api/public/locations").then((r) => r.data.locations);

export const registerDevice = (device_id) =>
  api.post("/api/register-device", { device_id }).then((r) => r.data);

export const issueToken = (payload) =>
  api.post("/api/issue-token", payload).then((r) => r.data.token);

export const submitAttendance = (formData) =>
  api
    .post("/api/submit-attendance", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
