// src/pages/admin/Compare.jsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDailyCompare } from "../../api/admin";
import Card from "../../components/Card";
import Button from "../../components/Button";

function toCSV(rows) {
  if (!rows?.length) return "nim,nama,semester\n";
  const headers = ["nim", "nama", "semester"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    const nim = `"${(r.nim ?? "").toString().replace(/"/g, '""')}"`;
    const nama = `"${(r.nama ?? "").toString().replace(/"/g, '""')}"`;
    const sem = Number(r.semester ?? "") || "";
    lines.push([nim, nama, sem].join(","));
  }
  return lines.join("\n");
}

function downloadCSV(filename, csv) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function Compare() {
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["daily-compare"],
    queryFn: getDailyCompare,
    refetchOnWindowFocus: false,
  });

  const date = data?.date ?? "-";

  // Map NIM -> detail untuk pagi & sore biar bisa tampilkan nama
  const pagiRows = data?.attendance?.pagi ?? [];
  const soreRows = data?.attendance?.sore ?? [];
  const pagiMap = useMemo(() => {
    const m = new Map();
    for (const r of pagiRows) m.set(r.nim, r);
    return m;
  }, [pagiRows]);
  const soreMap = useMemo(() => {
    const m = new Map();
    for (const r of soreRows) m.set(r.nim, r);
    return m;
  }, [soreRows]);

  // Bentuk list dengan nama (ambil dari sesi yang tersedia)
  const listPagiOnly = (data?.compare?.pagi_only ?? []).map(
    (nim) => pagiMap.get(nim) || { nim }
  );
  const listSoreOnly = (data?.compare?.sore_only ?? []).map(
    (nim) => soreMap.get(nim) || { nim }
  );
  const listBoth = (data?.compare?.both ?? []).map((nim) => {
    // ambil nama dari salah satu sesi (prioritas pagi)
    return pagiMap.get(nim) || soreMap.get(nim) || { nim };
  });

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card
        title={`Pembanding Kehadiran — ${date}`}
        right={
          <div className="flex gap-2">
            <Button onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Memuat..." : "Refresh"}
            </Button>
          </div>
        }
      >
        {isLoading ? (
          <div className="text-neutral-400">Loading...</div>
        ) : error ? (
          <div className="text-red-400">
            Gagal memuat: {error?.response?.data?.message || error.message}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {/* Pagi saja */}
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Pagi saja</div>
                <Button
                  onClick={() =>
                    downloadCSV(`pagi-saja-${date}.csv`, toCSV(listPagiOnly))
                  }
                  className="text-xs py-1"
                >
                  CSV
                </Button>
              </div>
              <div className="text-sm text-neutral-400 mb-2">
                {listPagiOnly.length} mahasiswa
              </div>
              <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {listPagiOnly.length === 0 && (
                  <li className="text-neutral-500 text-sm">— kosong —</li>
                )}
                {listPagiOnly.map((r) => (
                  <li
                    key={r.nim}
                    className="flex items-center justify-between border border-neutral-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{r.nim}</div>
                      <div className="text-xs text-neutral-400">
                        {r.nama || "-"}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Sem {r.semester ?? "-"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sore saja */}
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Sore saja</div>
                <Button
                  onClick={() =>
                    downloadCSV(`sore-saja-${date}.csv`, toCSV(listSoreOnly))
                  }
                  className="text-xs py-1"
                >
                  CSV
                </Button>
              </div>
              <div className="text-sm text-neutral-400 mb-2">
                {listSoreOnly.length} mahasiswa
              </div>
              <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {listSoreOnly.length === 0 && (
                  <li className="text-neutral-500 text-sm">— kosong —</li>
                )}
                {listSoreOnly.map((r) => (
                  <li
                    key={r.nim}
                    className="flex items-center justify-between border border-neutral-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{r.nim}</div>
                      <div className="text-xs text-neutral-400">
                        {r.nama || "-"}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Sem {r.semester ?? "-"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Keduanya (lengkap) */}
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">Lengkap (Pagi & Sore)</div>
                <Button
                  onClick={() =>
                    downloadCSV(`lengkap-${date}.csv`, toCSV(listBoth))
                  }
                  className="text-xs py-1"
                >
                  CSV
                </Button>
              </div>
              <div className="text-sm text-neutral-400 mb-2">
                {listBoth.length} mahasiswa
              </div>
              <ul className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                {listBoth.length === 0 && (
                  <li className="text-neutral-500 text-sm">— kosong —</li>
                )}
                {listBoth.map((r) => (
                  <li
                    key={r.nim}
                    className="flex items-center justify-between border border-neutral-800 rounded-lg px-3 py-2"
                  >
                    <div>
                      <div className="font-medium">{r.nim}</div>
                      <div className="text-xs text-neutral-400">
                        {r.nama || "-"}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Sem {r.semester ?? "-"}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      <Card title="Catatan">
        <div className="text-sm text-neutral-400 space-y-2">
          <p>
            Halaman ini menggunakan data <b>hari ini</b> dari endpoint{" "}
            <code>/api/admin/list</code>. Kategori:
          </p>
          <ul className="list-disc ml-6">
            <li>
              <b>Pagi saja</b>: hadir pagi, tidak sore.
            </li>
            <li>
              <b>Sore saja</b>: hadir sore, tidak pagi.
            </li>
            <li>
              <b>Lengkap</b>: hadir pagi & sore.
            </li>
          </ul>
          <p>
            Untuk melihat siapa yang <b>tidak hadir sama sekali</b>, dibutuhkan
            daftar mahasiswa (roster) sebagai pembanding — belum ada di sistem
            ini.
          </p>
        </div>
      </Card>
    </div>
  );
}
