import { api } from "./client";

export const getLocationsPublic = () =>
  api
    .get("/api/public/locations", {
      // cancel request lama kalau user klik "Muat Lokasi" berulang
      dedupeKey: "GET:/api/public/locations",
      timeout: 12000,
    })
    .then((r) => r.data.locations);

export const registerDevice = (device_id) =>
  api
    .post(
      "/api/register-device",
      { device_id },
      {
        // kunci per device agar klik beruntun tidak numpuk
        dedupeKey: `POST:/api/register-device:${device_id}`,
        timeout: 12000,
      }
    )
    .then((r) => r.data);

export const issueToken = (payload) =>
  api
    .post("/api/issue-token", payload, {
      // pakai key stabil agar percobaan berikutnya batalkan yang lama
      dedupeKey: `POST:/api/issue-token:${payload.device_id}:${payload.nim}:${payload.jenis}`,
      timeout: 12000,
    })
    .then((r) => r.data.token);

export const submitAttendance = (formData) =>
  api
    .post("/api/submit-attendance", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      // batalkan upload lama jika user klik "Kirim" lagi
      dedupeKey: "POST:/api/submit-attendance",
      timeout: 60000, // upload foto + proses wajah bisa lebih lama
    })
    .then((r) => r.data);
