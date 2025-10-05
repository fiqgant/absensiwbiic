// src/pages/admin/Attendance.jsx
import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchAttendanceAll, // dump data per range tanggal
  exportRange, // CSV dari server (hanya range tanggal)
  patchAttendance,
  deleteAttendance,
  listLocations,
} from "../../api/admin";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Button from "../../components/Button";
import { Table } from "../../components/Table";
import { API_BASE } from "../../api/client";

// helper kecil untuk string search
const norm = (s) => (s ?? "").toString().toLowerCase();

export default function Attendance() {
  // default range: 30 hari terakhir (sinkron sama backend /attendance-all)
  const today = new Date().toISOString().slice(0, 10);
  const past = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [filters, setFilters] = useState({
    date_from: past,
    date_to: today,
    jenis: "",
    loc_id: "",
    q: "",
    sort: "ts_server_desc",
    page: 1,
    page_size: 25,
  });

  // Dropdown lokasi
  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: listLocations,
  });

  // Ambil dump data tanpa filter server (hanya rentang tanggal + cap)
  const {
    data,
    isFetching,
    refetch,
    error: fetchErr,
  } = useQuery({
    queryKey: ["attendance-all", filters.date_from, filters.date_to],
    queryFn: () =>
      fetchAttendanceAll({
        date_from: filters.date_from,
        date_to: filters.date_to,
        max: 20000, // batas aman client
      }),
    keepPreviousData: true,
  });

  const allRows = data?.rows ?? [];

  const filtered = useMemo(() => {
    const fJenis = filters.jenis;
    const fLoc = filters.loc_id ? Number(filters.loc_id) : null;
    const q = norm(filters.q);

    let rows = allRows;

    if (fJenis) rows = rows.filter((r) => r.jenis === fJenis);
    if (fLoc != null) rows = rows.filter((r) => r.loc_id === fLoc);
    if (q) {
      rows = rows.filter(
        (r) =>
          norm(r.nim).includes(q) ||
          norm(r.nama).includes(q) ||
          norm(r.nama_kelompok).includes(q) ||
          norm(r.nama_fasilitator).includes(q) ||
          norm(r.loc_name_snapshot).includes(q)
      );
    }

    // sort client
    const sorted = [...rows].sort((a, b) => {
      switch (filters.sort) {
        case "ts_server_asc":
          return new Date(a.ts_server) - new Date(b.ts_server);
        case "ts_server_desc":
          return new Date(b.ts_server) - new Date(a.ts_server);
        case "nim_asc":
          return String(a.nim).localeCompare(String(b.nim), "id");
        case "nim_desc":
          return String(b.nim).localeCompare(String(a.nim), "id");
        default:
          return 0;
      }
    });

    return sorted;
  }, [allRows, filters]);

  // Paging client
  const total = filtered.length;
  const start = (filters.page - 1) * filters.page_size;
  const end = start + filters.page_size;
  const pageRows = filtered.slice(start, end);

  // Mutations (tetap ke server)
  const mPatch = useMutation({
    mutationFn: ({ id, payload }) => patchAttendance(id, payload),
    onSuccess: () => refetch(),
  });

  const mDelete = useMutation({
    mutationFn: (id) => deleteAttendance(id),
    onSuccess: () => refetch(),
  });

  // Export CSV via server (berdasarkan rentang tanggal)
  const doExport = async () => {
    const blob = await exportRange({
      date_from: filters.date_from,
      date_to: filters.date_to,
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `absensi-${filters.date_from}-sd-${filters.date_to}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Kolom tabel (perhatikan key "photo_url" ada + render link absolut)
  const columns = useMemo(
    () => [
      { key: "ts_server", header: "Waktu (WIB)" },
      { key: "jenis", header: "Sesi" },
      { key: "nim", header: "NIM" },
      { key: "nama", header: "Nama" },
      { key: "semester", header: "Sem" },
      { key: "nama_kelompok", header: "Kelompok" },
      { key: "nama_fasilitator", header: "Fasilitator" },
      { key: "loc_name_snapshot", header: "Lokasi" },
      { key: "distance_m", header: "Jarak (m)" },
      {
        key: "photo_url",
        header: "Foto",
        render: (v) => {
          if (!v) return "-";
          const href = v.startsWith("/") ? `${API_BASE}${v}` : v;
          return (
            <a
              className="text-blue-400 underline"
              href={href}
              target="_blank"
              rel="noreferrer noopener"
            >
              Buka
            </a>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card title="Filter (Client-side)">
        <div className="grid sm:grid-cols-6 gap-3">
          <Input
            label="Dari (YYYY-MM-DD)"
            value={filters.date_from}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_from: e.target.value,
                page: 1,
              }))
            }
          />
          <Input
            label="Sampai (YYYY-MM-DD)"
            value={filters.date_to}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                date_to: e.target.value,
                page: 1,
              }))
            }
          />
          <Select
            label="Sesi"
            value={filters.jenis}
            onChange={(e) =>
              setFilters((f) => ({ ...f, jenis: e.target.value, page: 1 }))
            }
          >
            <option value="">Semua</option>
            <option value="pagi">Pagi</option>
            <option value="sore">Sore</option>
          </Select>
          <Select
            label="Lokasi"
            value={filters.loc_id}
            onChange={(e) =>
              setFilters((f) => ({ ...f, loc_id: e.target.value, page: 1 }))
            }
          >
            <option value="">Semua</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
          <Input
            label="Cari (nim/nama/kelompok/fasilitator/lokasi)"
            value={filters.q}
            onChange={(e) =>
              setFilters((f) => ({ ...f, q: e.target.value, page: 1 }))
            }
          />
          <Select
            label="Sort"
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value }))
            }
          >
            <option value="ts_server_desc">Waktu ↓</option>
            <option value="ts_server_asc">Waktu ↑</option>
            <option value="nim_asc">NIM ↑</option>
            <option value="nim_desc">NIM ↓</option>
          </Select>
          <div className="sm:col-span-6 flex gap-2">
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Memuat..." : "Muat Ulang (range)"}
            </Button>
            <Button onClick={doExport}>Export CSV (range)</Button>
          </div>
          {fetchErr && (
            <div className="sm:col-span-6 text-red-400 text-sm">
              Gagal memuat data: {fetchErr?.message || "unknown error"}
            </div>
          )}
        </div>
      </Card>

      <Card
        title={`Data (${total})`}
        right={
          <div className="flex items-center gap-2 text-sm">
            <span>Page</span>
            <input
              className="w-16 px-2 py-1 rounded bg-neutral-900 border border-neutral-700"
              type="number"
              min={1}
              value={filters.page}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  page: Math.max(1, Number(e.target.value || 1)),
                }))
              }
            />
            <span>Size</span>
            <select
              className="px-2 py-1 rounded bg-neutral-900 border border-neutral-700"
              value={filters.page_size}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  page_size: Number(e.target.value),
                  page: 1,
                }))
              }
            >
              {[10, 25, 50, 100, 200].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <Table
          columns={columns}
          rows={pageRows}
          renderActions={(r) => (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const nama = prompt("Nama:", r.nama ?? "");
                  if (nama == null) return;
                  const semesterInput = prompt(
                    "Semester:",
                    r.semester == null ? "1" : String(r.semester)
                  );
                  if (semesterInput == null) return;
                  const semester = Number(semesterInput) || r.semester || 1;
                  mPatch.mutate({ id: r.id, payload: { nama, semester } });
                }}
              >
                Edit
              </Button>
              <Button
                onClick={() => {
                  if (confirm("Hapus baris ini?")) mDelete.mutate(r.id);
                }}
                className="bg-red-900 hover:bg-red-800 border-red-800"
              >
                Hapus
              </Button>
            </div>
          )}
        />
      </Card>
    </div>
  );
}
