import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getLocationsPublic,
  registerDevice,
  issueToken,
  submitAttendance,
} from "../../api/public";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Popup,
  useMap,
} from "react-leaflet";

function isGoogleDriveUrl(raw) {
  if (!raw) return false;
  const urlStr = String(raw).trim();
  try {
    const u = new URL(urlStr);
    const allowedHosts = new Set(["drive.google.com", "docs.google.com"]);
    if (u.protocol !== "https:" || !allowedHosts.has(u.hostname)) return false;

    const p = u.pathname;
    const ok =
      p.startsWith("/file/d/") ||
      p.startsWith("/open") ||
      p.startsWith("/folders/") ||
      p.startsWith("/drive/folders/") ||
      p.startsWith("/uc") ||
      p.startsWith("/document/") ||
      p.startsWith("/spreadsheets/") ||
      p.startsWith("/presentation/");
    if (!ok) return false;

    if (
      p.includes("/file/d/") ||
      p.includes("/drive/folders/") ||
      p.includes("/folders/") ||
      p.startsWith("/uc") ||
      p.startsWith("/open")
    ) {
      const hasIdInPath = /\/(d|folders)\/[^/?#]+/.test(p);
      const hasIdQuery = u.searchParams.has("id");
      if (!hasIdInPath && !hasIdQuery) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function getDeviceId() {
  try {
    let id = localStorage.getItem("device_id");
    if (!id) {
      let rand = "";
      try {
        rand = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
      } catch {
        rand = Date.now().toString(16) + Math.random().toString(16).slice(2);
      }
      id = "dev-" + rand;
      localStorage.setItem("device_id", id);
    }
    return id;
  } catch {
    return (
      "dev-" + (Date.now().toString(16) + Math.random().toString(16).slice(2))
    );
  }
}

function SetView({ center, zoom = 16 }) {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      Array.isArray(center) &&
      Number.isFinite(center[0]) &&
      Number.isFinite(center[1])
    ) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

const FASILITATORS = [
  "Aldon Sinaga",
  "Aston Situmorang",
  "Bernadet Sihombing",
  "Brilliant Handyman Manalu",
  "Dany Juhandi",
  "Elvina Emanuella Br Surbakti",
  "Enty Evasari",
  "Ferawati",
  "Jenny Elisabeth",
  "Jessica",
  "Juni Anggraini",
  "Maryam Monika",
  "Natalia",
  "Rio Fernandez",
  "Rizki Ramadhansyah",
  "Septian Simatupang",
  "Taufiqurrahman",
  "Vinsensius Matondang",
  "Lainnya",
];

export default function Home() {
  const [deviceId, setDeviceId] = useState(() => {
    try {
      return localStorage.getItem("device_id") || "";
    } catch {
      return "";
    }
  });
  const [regStatus, setRegStatus] = useState("idle");
  const [submitting, setSubmitting] = useState(false); // hanya kunci submit

  // === Lokasi: fetch HANYA saat diklik & non-blocking ===
  const {
    data: locations = [],
    refetch: refetchLocations,
    isFetching: isLocLoading,
    isFetched: isLocFetched,
  } = useQuery({
    queryKey: ["locs-public"],
    queryFn: getLocationsPublic,
    enabled: false,         // manual fetch (via tombol)
    retry: false,           // jangan auto-retry
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    suspense: false,        // penting: jangan trigger Suspense overlay
  });

  const [locId, setLocId] = useState("");
  const [jenis, setJenis] = useState("pagi");
  const [geo, setGeo] = useState({ lat: null, lon: null, status: "idle" });

  const [form, setForm] = useState({
    nama: "",
    nim: "",
    semester: "1",
    nama_kelompok: "",
    nama_fasilitator: FASILITATORS[0],
  });
  const [fasilitatorOther, setFasilitatorOther] = useState("");
  const [soreExtra, setSoreExtra] = useState({
    hasil_diskusi: "",
    link_gdrive: "",
    link_kegiatan: "",
  });

  const [photo, setPhoto] = useState(null);
  const [msg, setMsg] = useState("");

  // ==== Validasi realtime (sore) ====
  const hasilDiskusiTrim = useMemo(
    () => String(soreExtra.hasil_diskusi || "").trim(),
    [soreExtra.hasil_diskusi]
  );
  const hasilDiskusiLen = hasilDiskusiTrim.length;
  const isHasilDiskusiValid = hasilDiskusiLen >= 120;

  const linkGDriveTrim = useMemo(
    () => String(soreExtra.link_gdrive || "").trim(),
    [soreExtra.link_gdrive]
  );
  const isLinkGDriveFilled = linkGDriveTrim.length > 0;
  const isLinkGDriveValid =
    isLinkGDriveFilled && isGoogleDriveUrl(linkGDriveTrim);

  const linkKegiatanTrim = useMemo(
    () => String(soreExtra.link_kegiatan || "").trim(),
    [soreExtra.link_kegiatan]
  );
  const isLinkKegiatanFilled = linkKegiatanTrim.length > 0;
  const isLinkKegiatanValid =
    isLinkKegiatanFilled && isGoogleDriveUrl(linkKegiatanTrim);

  useEffect(() => {
    if (regStatus === "registering") {
      const t = setTimeout(() => {
        setRegStatus((s) => (s === "registering" ? "error" : s));
      }, 12000);
      return () => clearTimeout(t);
    }
  }, [regStatus]);

  useEffect(() => {
    if (!locId && locations.length) setLocId(String(locations[0].id));
  }, [locations, locId]);

  const selectedLoc = useMemo(
    () => locations.find((l) => String(l.id) === String(locId)) || null,
    [locations, locId]
  );

  const defaultCenter = useMemo(() => {
    if (
      geo.status === "ok" &&
      Number.isFinite(geo.lat) &&
      Number.isFinite(geo.lon)
    ) {
      return [geo.lat, geo.lon];
    }
    if (selectedLoc) return [Number(selectedLoc.lat), Number(selectedLoc.lon)];
    return [-6.2, 106.816666];
  }, [selectedLoc, geo.status, geo.lat, geo.lon]);

  const getGPS = () => {
    setMsg("");
    if (!("geolocation" in navigator)) {
      setGeo({
        lat: null,
        lon: null,
        status: "error: Geolocation tidak didukung",
      });
      return;
    }
    setGeo((g) => ({ ...g, status: "requesting" }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          status: "ok",
        }),
      (err) =>
        setGeo({
          lat: null,
          lon: null,
          status:
            "error: " + (err && err.message ? err.message : "tidak diketahui"),
        }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onChangeNIM = (e) => {
    const onlyDigits = String(e.target.value || "").replace(/\D+/g, "");
    setForm((f) => ({ ...f, nim: onlyDigits }));
  };

  const onGetDevice = async () => {
    setMsg("");
    if (regStatus === "registering") return; // cegah spam klik
    try {
      const id = getDeviceId();
      setDeviceId(id);
      setRegStatus("registering");
      await registerDevice(id); // hanya saat tombol diklik
      setRegStatus("ok");
      setMsg("Perangkat terdaftar untuk hari ini. ✔️");
    } catch {
      setRegStatus("error");
      setMsg("Gagal registrasi perangkat. Coba lagi.");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (submitting) return; // cegah double-click
    setSubmitting(true);

    try {
      if (regStatus !== "ok") {
        setMsg('Klik "Get Device ID" terlebih dahulu untuk registrasi perangkat.');
        return;
      }
      if (!geo.lat || !geo.lon) {
        setMsg("Ambil lokasi GPS dulu.");
        return;
      }
      if (!photo) {
        setMsg("Ambil/unggah foto wajah.");
        return;
      }
      if (!locId) {
        setMsg("Pilih lokasi.");
        return;
      }
      if (!form.nim || !/^\d+$/.test(form.nim)) {
        setMsg("NIM harus berupa angka.");
        return;
      }

      let finalFasilitator = form.nama_fasilitator;
      if (finalFasilitator === "Lainnya") {
        if (!fasilitatorOther.trim()) {
          setMsg('Isi nama fasilitator pada kolom "Lainnya".');
          return;
        }
        finalFasilitator = fasilitatorOther.trim();
      }

      let trimmedLinkGdrive = "";
      if (jenis === "sore") {
        if (!isHasilDiskusiValid) {
          setMsg("Hasil Diskusi wajib diisi minimal 120 karakter.");
          return;
        }

        trimmedLinkGdrive = linkGDriveTrim;
        if (!isLinkGDriveValid) {
          setMsg(
            !isLinkGDriveFilled
              ? "Link GDrive Foto Diskusi wajib diisi."
              : "Link GDrive Foto Diskusi harus berupa tautan Google Drive/Docs yang valid."
          );
          return;
        }

        if (!isLinkKegiatanValid) {
          setMsg(
            !isLinkKegiatanFilled
              ? "Link Foto Kegiatan wajib diisi."
              : "Link Foto Kegiatan harus tautan Google Drive/Docs yang valid."
          );
          return;
        }
      }

      // API token & submit: hanya saat user klik "Kirim Absensi"
      const token = await issueToken({
        device_id: deviceId,
        nim: form.nim,
        semester: Number(form.semester),
        jenis,
        lat: geo.lat,
        lon: geo.lon,
        loc_id: Number(locId),
      });

      const fd = new FormData();
      fd.append("token", token);
      fd.append("nama", form.nama);
      fd.append("nim", form.nim);
      fd.append("semester", form.semester);
      fd.append("jenis", jenis);
      fd.append("lat", String(geo.lat));
      fd.append("lon", String(geo.lon));
      fd.append("nama_kelompok", form.nama_kelompok);
      fd.append("nama_fasilitator", finalFasilitator);

      if (jenis === "sore") {
        fd.append("hasil_diskusi", hasilDiskusiTrim);
        fd.append("link_gdrive", trimmedLinkGdrive);
        fd.append("link_kegiatan", linkKegiatanTrim);
      }
      fd.append("photo", photo);

      const res = await submitAttendance(fd);
      setMsg(
        `✅ ${res.message} • jarak ${res.distance_m} m • lokasi ${
          res.lokasi?.name ?? "-"
        }`
      );
    } catch (e) {
      const serverMsg =
        (e && e.response && e.response.data && e.response.data.message) ||
        (e && e.message) ||
        "Gagal submit";
      setMsg("❌ " + serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <Card title="Absensi Entrepreneurship (Rabu)">
        {/* Seksi registrasi device */}
        <div className="mb-4 p-3 rounded-lg border border-neutral-800 bg-neutral-900/40">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              onClick={onGetDevice}
              disabled={regStatus === "registering"}
            >
              {regStatus === "registering"
                ? "Mendaftarkan..."
                : "Get Device ID"}
            </Button>
            <div className="text-sm text-neutral-400">
              {deviceId ? (
                <>
                  Device ID:{" "}
                  <span className="text-neutral-200">{deviceId}</span> • Status:{" "}
                  {regStatus === "ok"
                    ? "Terdaftar hari ini"
                    : regStatus === "registering"
                    ? "Mendaftar..."
                    : regStatus === "error"
                    ? "Gagal daftar"
                    : "Belum daftar"}
                </>
              ) : (
                "Belum ada Device ID. Klik tombol untuk membuat & mendaftar."
              )}
            </div>
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            *Registrasi perlu dilakukan setiap hari (server reset harian).
          </div>
        </div>

        {/* Peta */}
        <div className="rounded-xl overflow-hidden border border-neutral-800 mb-4">
          <MapContainer
            center={defaultCenter}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: 320, width: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <SetView center={defaultCenter} />

            {selectedLoc && Number.isFinite(Number(selectedLoc.radius_m)) && (
              <>
                <Marker
                  position={[Number(selectedLoc.lat), Number(selectedLoc.lon)]}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">{selectedLoc.name}</div>
                      <div>radius: {selectedLoc.radius_m} m</div>
                    </div>
                  </Popup>
                </Marker>
                <Circle
                  center={[Number(selectedLoc.lat), Number(selectedLoc.lon)]}
                  radius={Number(selectedLoc.radius_m)}
                  pathOptions={{ color: "#60a5fa", fillOpacity: 0.08 }}
                />
              </>
            )}

            {geo.status === "ok" &&
              Number.isFinite(geo.lat) &&
              Number.isFinite(geo.lon) && (
                <Marker position={[geo.lat, geo.lon]}>
                  <Popup>Posisi kamu</Popup>
                </Marker>
              )}
          </MapContainer>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <Select
            label="Sesi"
            value={jenis}
            onChange={(e) => setJenis(e.target.value)}
          >
            <option value="pagi">Pagi (10-12)</option>
            <option value="sore">Sore (16-18)</option>
          </Select>

          {/* Muat lokasi manual */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => {
                setMsg("");
                if (!isLocLoading) refetchLocations(); // non-blocking
              }}
              disabled={isLocLoading}
            >
              {isLocLoading
                ? "Memuat Lokasi..."
                : isLocFetched
                ? "Muat Ulang Lokasi"
                : "Muat Lokasi dari Server"}
            </Button>
            <div className="text-xs text-neutral-500">
              {isLocFetched
                ? `Lokasi ter-load (${locations.length} item).`
                : "Klik untuk mengambil daftar lokasi dari server."}
            </div>
          </div>

          <Select
            label="Lokasi"
            value={locId}
            onChange={(e) => setLocId(e.target.value)}
            disabled={!isLocFetched || locations.length === 0}
          >
            <option value="">
              {isLocFetched ? "Pilih lokasi" : "Muat lokasi dulu"}
            </option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>

          {/* Lokasi Saya (GPS) */}
          <div>
            <div className="mb-1 text-sm text-neutral-400">Lokasi Saya</div>
            <div className="flex items-center gap-2">
              <Button type="button" onClick={getGPS}>
                Ambil Lokasi
              </Button>
              <div className="text-xs text-neutral-400">
                {geo.status === "ok" ? (
                  <>
                    lat {Number(geo.lat).toFixed(6)} / lon{" "}
                    {Number(geo.lon).toFixed(6)}
                  </>
                ) : geo.status === "idle" ? (
                  "Belum diambil"
                ) : geo.status === "requesting" ? (
                  "Mengambil lokasi..."
                ) : (
                  geo.status
                )}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Nama"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              required
            />

            <div>
              <Input
                label="NIM (angka saja)"
                value={form.nim}
                onChange={onChangeNIM}
                inputMode="numeric"
                pattern="[0-9]+"
                placeholder="contoh: 23123456"
                required
              />
              <div className="text-xs text-neutral-500 mt-1">
                NIM harus berisi angka saja.
              </div>
            </div>

            <Select
              label="Semester"
              value={form.semester}
              onChange={(e) =>
                setForm((f) => ({ ...f, semester: e.target.value }))
              }
            >
              <option value="1">1</option>
              <option value="3">3</option>
              <option value="5">5</option>
            </Select>

            <div>
              <Input
                label="Nama Kelompok"
                value={form.nama_kelompok}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nama_kelompok: e.target.value }))
                }
                required
              />
              <div className="text-xs text-neutral-500 mt-1">
                Apabila belum tergabung dalam kelompok, isi dengan tanda “-”.
              </div>
            </div>

            <div>
              <Select
                label="Nama Fasilitator"
                value={form.nama_fasilitator}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => ({ ...f, nama_fasilitator: v }));
                  if (v !== "Lainnya") setFasilitatorOther("");
                }}
              >
                {FASILITATORS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
              <div className="text-xs text-neutral-500 mt-1">
                Jika tidak menemukan nama fasilitator pada daftar, pilih
                &quot;Lainnya&quot;.
              </div>
            </div>

            {form.nama_fasilitator === "Lainnya" dan (
              <Input
                label="Isi Nama Fasilitator (Lainnya)"
                value={fasilitatorOther}
                onChange={(e) => setFasilitatorOther(e.target.value)}
                placeholder="Nama fasilitator"
              />
            )}
          </div>

          {jenis === "sore" dan (
            <div className="grid gap-3">
              <div>
                <Input
                  label="Hasil Diskusi"
                  value={soreExtra.hasil_diskusi}
                  onChange={(e) =>
                    setSoreExtra((p) => ({
                      ...p,
                      hasil_diskusi: e.target.value,
                    }))
                  }
                  required
                  minLength={120}
                  onInvalid={(e) => {
                    e.target.setCustomValidity(
                      "Hasil Diskusi wajib diisi minimal 120 karakter."
                    );
                  }}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                  placeholder="Tuliskan ringkasan hasil diskusi (≥120 karakter)"
                />
                <div
                  className={
                    "text-xs mt-1 " +
                    (hasilDiskusiLen === 0
                      ? "text-neutral-500"
                      : isHasilDiskusiValid
                      ? "text-green-400"
                      : "text-amber-400")
                  }
                >
                  Panjang saat ini:{" "}
                  <span className="font-medium">{hasilDiskusiLen}</span>{" "}
                  karakter{" "}
                  {!isHasilDiskusiValid &&
                    hasilDiskusiLen > 0 &&
                    `(kurang ${120 - hasilDiskusiLen})`}
                </div>
              </div>

              <div>
                <Input
                  label="Link GDrive Foto Diskusi"
                  value={soreExtra.link_gdrive}
                  onChange={(e) =>
                    setSoreExtra((p) => ({
                      ...p,
                      link_gdrive: e.target.value.trim(),
                    }))
                  }
                  placeholder="Contoh: https://drive.google.com/file/d/FILE_ID/view"
                  required
                  inputMode="url"
                  pattern={
                    "^https://(drive|docs)\\.google\\.com/(?:" +
                    "file/d/[^/?#]+(?:/[^?#]*)?" +
                    "|" +
                    "open\\?id=[^&\\s]+" +
                    "|" +
                    "(?:drive/)?folders/[^/?#]+" +
                    "|" +
                    "uc\\?id=[^&\\s]+" +
                    "|" +
                    "document/[^\\s]+" +
                    "|" +
                    "spreadsheets/[^\\s]+" +
                    "|" +
                    "presentation/[^\\s]+" +
                    ")"
                  }
                  onInvalid={(e) => {
                    e.target.setCustomValidity(
                      "Harus berupa tautan Google Drive/Docs yang valid (https://drive.google.com/… atau https://docs.google.com/…)."
                    );
                  }}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                />
                <div
                  className={
                    "text-xs mt-1 " +
                    (isLinkGDriveFilled
                      ? isLinkGDriveValid
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-amber-400")
                  }
                >
                  {isLinkGDriveFilled
                    ? isLinkGDriveValid
                      ? "✔ Tautan valid (Google Drive/Docs)."
                      : "✘ Bukan tautan Google Drive/Docs yang valid."
                    : "• Wajib diisi."}
                </div>
              </div>

              <div>
                <Input
                  label="Link Foto Kegiatan"
                  value={soreExtra.link_kegiatan}
                  onChange={(e) =>
                    setSoreExtra((p) => ({
                      ...p,
                      link_kegiatan: e.target.value.trim(),
                    }))
                  }
                  placeholder="Wajib: URL Google Drive/Docs"
                  inputMode="url"
                  required
                  pattern={
                    "^https://(drive|docs)\\.google\\.com/(?:" +
                    "file/d/[^/?#]+(?:/[^?#]*)?" +
                    "|" +
                    "open\\?id=[^&\\s]+" +
                    "|" +
                    "(?:drive/)?folders/[^/?#]+" +
                    "|" +
                    "uc\\?id=[^&\\s]+" +
                    "|" +
                    "document/[^\\s]+" +
                    "|" +
                    "spreadsheets/[^\\s]+" +
                    "|" +
                    "presentation/[^\\s]+" +
                    ")"
                  }
                  onInvalid={(e) => {
                    e.target.setCustomValidity(
                      "Link Foto Kegiatan wajib dan harus tautan Google Drive/Docs yang valid."
                    );
                  }}
                  onInput={(e) => e.currentTarget.setCustomValidity("")}
                />
                <div
                  className={
                    "text-xs mt-1 " +
                    (isLinkKegiatanFilled
                      ? isLinkKegiatanValid
                        ? "text-green-400"
                        : "text-red-400"
                      : "text-amber-400")
                  }
                >
                  {isLinkKegiatanFilled
                    ? isLinkKegiatanValid
                      ? "✔ Tautan valid (Google Drive/Docs)."
                      : "✘ Bukan tautan Google Drive/Docs yang valid."
                    : "• Wajib diisi."}
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <div className="mb-1 text-sm text-neutral-400">
                Foto Wajah (ambil dari kamera)
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) =>
                  setPhoto((e.target.files && e.target.files[0]) || null)
                }
                disabled={submitting} // hanya file input yang dikunci saat submit
              />
              <div className="text-xs text-neutral-500 mt-1">
                Saat dibuka di HP, ini akan langsung menawarkan kamera.
              </div>
            </label>
          </div>

          {msg && <div className="text-sm">{msg}</div>}
          <Button className="w-full" type="submit" disabled={submitting || regStatus !== "ok"}>
            {regStatus !== "ok"
              ? "Kirim Absensi (perlu registrasi device)"
              : submitting
              ? "Mengirim..."
              : "Kirim Absensi"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
