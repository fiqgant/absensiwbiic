import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_BASE,
});

// Timeout global (hindari request ngegantung lama lalu user klik ulang)
api.defaults.timeout = 15000;

// ---- Simple in-flight dedupe & cancel ----
// Kunci: method + url (bisa dioverride dengan cfg.dedupeKey)
const inflight = new Map(); // key -> AbortController

function buildKey(cfg) {
  if (cfg.dedupeKey) return cfg.dedupeKey;
  const m = (cfg.method || "get").toUpperCase();
  const u = (cfg.baseURL || "") + (cfg.url || "");
  return `${m}:${u}`;
}

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem("admin_token");
  if (t) cfg.headers.Authorization = `Bearer ${t}`;

  // Dedupe aktif secara default; set cfg.dedupe = false untuk menonaktifkan
  const dedupeOn = cfg.dedupe !== false;
  if (dedupeOn) {
    const key = buildKey(cfg);
    // batalkan request sebelumnya dengan key yang sama
    const prev = inflight.get(key);
    if (prev) {
      try {
        prev.abort();
      } catch {
        /* empty */
      }
      inflight.delete(key);
    }
    const ac = new AbortController();
    cfg.signal = cfg.signal ?? ac.signal;
    cfg.__dedupeKey = key;
    inflight.set(key, ac);
  }

  return cfg;
});

api.interceptors.response.use(
  (r) => {
    const key = r?.config?.__dedupeKey;
    if (key) inflight.delete(key);
    return r;
  },
  (err) => {
    const key = err?.config?.__dedupeKey;
    if (key) inflight.delete(key);

    if (err?.response?.status === 401) {
      localStorage.removeItem("admin_token");
    }
    return Promise.reject(err);
  }
);
