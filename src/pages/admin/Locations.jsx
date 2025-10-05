import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../../api/admin";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

/* Marker DivIcon (tanpa file ikon) */
const dotIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:9999px;background:#3b82f6;box-shadow:0 0 0 2px rgba(255,255,255,.65)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function DraggableMarker({ position, onChange }) {
  const [pos, setPos] = useState(position);

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPos([lat, lng]);
      onChange(lat, lng);
    },
  });

  return (
    <Marker
      draggable
      position={pos}
      icon={dotIcon}
      eventHandlers={{
        dragend: (e) => {
          const p = e.target.getLatLng();
          setPos([p.lat, p.lng]);
          onChange(p.lat, p.lng);
        },
      }}
    />
  );
}

function MapPicker({ lat, lon, radius, onLatLon, onRadius, height = 360 }) {
  const latNum = Number(lat) || -6.2001;
  const lonNum = Number(lon) || 106.8167;
  const radNum = Number(radius) || 120;

  return (
    <div className="rounded-xl overflow-hidden border border-neutral-800">
      <MapContainer
        key={`${latNum},${lonNum}`} // force re-mount saat center berubah
        center={[latNum, lonNum]}
        zoom={17}
        scrollWheelZoom
        style={{ height }}
        className="bg-black"
      >
        {/* Pakai OSM dulu supaya pasti tampil. Nanti bisa ganti ke Carto Dark */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <DraggableMarker position={[latNum, lonNum]} onChange={onLatLon} />
        {radNum > 0 && (
          <Circle
            center={[latNum, lonNum]}
            radius={radNum}
            pathOptions={{
              color: "#60a5fa",
              fillColor: "#60a5fa",
              fillOpacity: 0.18,
              weight: 2,
            }}
          />
        )}
      </MapContainer>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 border-t border-neutral-800 bg-neutral-900">
        <div className="flex gap-2 items-center">
          <label className="text-sm text-neutral-400 w-24">Latitude</label>
          <input
            className="bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg w-full outline-none"
            type="number"
            step="any"
            value={latNum}
            onChange={(e) => onLatLon(Number(e.target.value), lonNum)}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-neutral-400 w-24">Longitude</label>
          <input
            className="bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg w-full outline-none"
            type="number"
            step="any"
            value={lonNum}
            onChange={(e) => onLatLon(latNum, Number(e.target.value))}
          />
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-neutral-400 w-24">Radius (m)</label>
          <input
            className="bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-lg w-full outline-none"
            type="number"
            min={10}
            step={5}
            value={radNum}
            onChange={(e) => onRadius(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

function MiniMap({ lat, lon, radius, height = 200 }) {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  const radNum = Number(radius);

  return (
    <div className="rounded-lg overflow-hidden border border-neutral-800">
      <MapContainer
        center={[latNum, lonNum]}
        zoom={16}
        dragging={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        touchZoom={false}
        keyboard={false}
        style={{ height }}
        className="bg-black"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[latNum, lonNum]} icon={dotIcon} />
        {radNum > 0 && (
          <Circle
            center={[latNum, lonNum]}
            radius={radNum}
            pathOptions={{
              color: "#60a5fa",
              fillColor: "#60a5fa",
              fillOpacity: 0.18,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default function Locations() {
  const qc = useQueryClient();
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["locations"],
    queryFn: listLocations,
  });

  const mCreate = useMutation({
    mutationFn: createLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
  const mUpdate = useMutation({
    mutationFn: ({ id, payload }) => updateLocation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });
  const mDelete = useMutation({
    mutationFn: (id) => deleteLocation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["locations"] }),
  });

  // ====== state form tambah ======
  const [lat, setLat] = useState(-6.2001);
  const [lon, setLon] = useState(106.8167);
  const [radius, setRadius] = useState(120);
  const [active, setActive] = useState(true);

  // Inisialisasi ke lokasi aktif pertama (kalau ada)
  useEffect(() => {
    const firstActive = locations.find((l) => l.active);
    if (firstActive) {
      setLat(Number(firstActive.lat));
      setLon(Number(firstActive.lon));
      setRadius(Number(firstActive.radius_m || 120));
    }
  }, [locations]);

  const useGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    if (!name) return;

    await mCreate.mutateAsync({
      name,
      lat: Number(lat),
      lon: Number(lon),
      radius_m: Number(radius),
      active: Boolean(active),
    });

    e.currentTarget.reset();
    setActive(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card title="Tambah Lokasi (klik peta untuk set Lat/Lon)">
        <form onSubmit={onCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input label="Nama" name="name" required />
            <div className="sm:col-span-2">
              <div className="mb-1 text-sm text-neutral-400">Aktif</div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-5 w-5 accent-neutral-600"
                />
                <span className="text-sm text-neutral-300">
                  Lokasi aktif untuk dropdown mahasiswa
                </span>
              </div>
            </div>
            <div className="sm:col-span-2 flex items-end justify-end">
              <Button type="button" onClick={useGPS}>
                Lokasi Saya
              </Button>
            </div>
          </div>

          <MapPicker
            lat={lat}
            lon={lon}
            radius={radius}
            onLatLon={(a, b) => {
              setLat(a);
              setLon(b);
            }}
            onRadius={(r) => setRadius(r)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Lat"
              name="lat"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              required
            />
            <Input
              label="Lon"
              name="lon"
              type="number"
              step="any"
              value={lon}
              onChange={(e) => setLon(Number(e.target.value))}
              required
            />
            <Input
              label="Radius (m)"
              name="radius_m"
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              required
            />
          </div>

          <Button type="submit" disabled={mCreate.isPending}>
            {mCreate.isPending ? "Menyimpan..." : "Simpan Lokasi"}
          </Button>
        </form>
      </Card>

      <Card title="Daftar Lokasi">
        {isLoading ? (
          <div className="text-neutral-400">Loading...</div>
        ) : locations.length === 0 ? (
          <div className="text-neutral-400">Belum ada lokasi.</div>
        ) : (
          <div className="space-y-3">
            {locations.map((l) => (
              <div
                key={l.id}
                className="rounded-xl p-3 border border-neutral-800 bg-neutral-900/40"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium">
                      {l.name}{" "}
                      {l.active ? (
                        <span className="text-xs text-green-400">● aktif</span>
                      ) : (
                        <span className="text-xs text-neutral-400">
                          ● nonaktif
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">
                      lat {l.lat} | lon {l.lon} | radius {l.radius_m} m
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        mUpdate.mutate({
                          id: l.id,
                          payload: { active: !l.active },
                        })
                      }
                    >
                      {l.active ? "Nonaktifkan" : "Aktifkan"}
                    </Button>
                    <Button
                      onClick={() => mDelete.mutate(l.id)}
                      className="bg-red-900 hover:bg-red-800 border-red-800"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>

                {/* Lazy render minimap supaya tinggi tidak nol saat collapsed */}
                <MiniMapLazy lat={l.lat} lon={l.lon} radius={l.radius_m} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* Lazy minimap di dalam <details> untuk hindari height=0 */
function MiniMapLazy({ lat, lon, radius }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="mt-3" onToggle={(e) => setOpen(e.target.open)}>
      <summary className="cursor-pointer text-sm text-neutral-400 hover:text-neutral-200">
        Lihat peta
      </summary>
      {open && (
        <div className="mt-3">
          <MiniMap
            lat={Number(lat)}
            lon={Number(lon)}
            radius={Number(radius)}
          />
        </div>
      )}
    </details>
  );
}
