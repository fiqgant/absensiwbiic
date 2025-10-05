// src/pages/admin/Report.jsx
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Card from "../../components/Card";
import { Table } from "../../components/Table";
import { fetchList } from "../../api/admin";

const colsBasic = [
  { key: "nim", header: "NIM" },
  { key: "nama", header: "Nama" },
  { key: "nama_kelompok", header: "Kelompok" },
  { key: "nama_fasilitator", header: "Fasilitator" },
  { key: "loc_name_snapshot", header: "Lokasi" },
  { key: "ts_server", header: "Waktu" },
];

export default function Report() {
  const { data, isFetching, error } = useQuery({
    queryKey: ["admin-list-today"],
    queryFn: fetchList,
    refetchOnWindowFocus: false,
  });

  const pagi = data?.attendance?.pagi ?? [];
  const sore = data?.attendance?.sore ?? [];
  const pagiOnlyNIM = new Set(data?.compare?.pagi_only ?? []);
  const soreOnlyNIM = new Set(data?.compare?.sore_only ?? []);
  const bothNIM = new Set(data?.compare?.both ?? []);

  const pagiOnlyRows = useMemo(
    () => pagi.filter((r) => pagiOnlyNIM.has(r.nim)),
    [pagi, pagiOnlyNIM]
  );
  const soreOnlyRows = useMemo(
    () => sore.filter((r) => soreOnlyNIM.has(r.nim)),
    [sore, soreOnlyNIM]
  );
  const bothRows = useMemo(() => {
    // ambil entri dari sesi pagi (atau bisa merge dua-duanya)
    const mapSoreByNim = new Map(sore.map((r) => [r.nim, r]));
    return pagi
      .filter((r) => bothNIM.has(r.nim))
      .map((r) => ({
        ...r,
        _sore_time: mapSoreByNim.get(r.nim)?.ts_server || "-",
      }));
  }, [pagi, sore, bothNIM]);

  // agregasi fasilitator & lokasi
  const aggrFasil = useMemo(() => {
    const all = [...pagi, ...sore];
    const m = new Map();
    for (const r of all) {
      const key = r.nama_fasilitator || "-";
      m.set(key, (m.get(key) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [pagi, sore]);

  const aggrLoc = useMemo(() => {
    const all = [...pagi, ...sore];
    const m = new Map();
    for (const r of all) {
      const key = r.loc_name_snapshot || "-";
      m.set(key, (m.get(key) || 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [pagi, sore]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card title="Ringkasan Hari Ini">
        {isFetching && <div>Memuat...</div>}
        {error && <div className="text-red-400 text-sm">Gagal memuat.</div>}
        {data && (
          <div className="grid sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded border border-neutral-800 bg-neutral-900/30">
              <div className="text-neutral-400">Tanggal</div>
              <div className="text-xl">{data.date}</div>
            </div>
            <div className="p-3 rounded border border-neutral-800 bg-neutral-900/30">
              <div className="text-neutral-400">Total Pagi</div>
              <div className="text-xl">{data.summary.total_pagi}</div>
            </div>
            <div className="p-3 rounded border border-neutral-800 bg-neutral-900/30">
              <div className="text-neutral-400">Total Sore</div>
              <div className="text-xl">{data.summary.total_sore}</div>
            </div>
            <div className="p-3 rounded border border-neutral-800 bg-neutral-900/30">
              <div className="text-neutral-400">Pagi & Sore</div>
              <div className="text-xl">{data.summary.both}</div>
            </div>
          </div>
        )}
      </Card>

      <Card title="Pagi Saja">
        <Table columns={colsBasic} rows={pagiOnlyRows} />
      </Card>

      <Card title="Sore Saja">
        <Table columns={colsBasic} rows={soreOnlyRows} />
      </Card>

      <Card title="Pagi & Sore (dengan waktu sore)">
        <Table
          columns={[
            ...colsBasic,
            { key: "_sore_time", header: "Waktu (Sore)" },
          ]}
          rows={bothRows}
        />
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card title="Agregasi per Fasilitator">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-800">
                <th className="py-2">Fasilitator</th>
                <th className="py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {aggrFasil.map((r) => (
                <tr key={r.name} className="border-b border-neutral-900/60">
                  <td className="py-1">{r.name}</td>
                  <td className="py-1">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Agregasi per Lokasi">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-neutral-800">
                <th className="py-2">Lokasi</th>
                <th className="py-2">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {aggrLoc.map((r) => (
                <tr key={r.name} className="border-b border-neutral-900/60">
                  <td className="py-1">{r.name}</td>
                  <td className="py-1">{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
