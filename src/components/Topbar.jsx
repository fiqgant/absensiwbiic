import Button from "./Button";
import { NavLink } from "react-router-dom";

const linkClass =
  "text-neutral-300 hover:text-white px-2 py-1 rounded-md transition-colors";
const activeClass = "text-white bg-neutral-800/60";

export default function Topbar({ admin, onLogout }) {
  return (
    <div className="sticky top-0 z-10 bg-neutral-950/80 backdrop-blur border-b border-neutral-900">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="font-semibold">Absensi Entrepreneurship</div>

        <div className="flex items-center gap-3 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `${linkClass} ${isActive ? activeClass : ""}`
            }
          >
            Mahasiswa
          </NavLink>

          {admin && (
            <>
              <NavLink
                to="/admin/attendance"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                Rekap
              </NavLink>

              <NavLink
                to="/admin/compare"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                Pembanding
              </NavLink>

              <NavLink
                to="/admin/report"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                Report
              </NavLink>

              <NavLink
                to="/admin/locations"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                Lokasi
              </NavLink>

              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">{admin.email}</span>
              {/* Penting: type="button" supaya tidak submit form */}
              <Button type="button" onClick={onLogout}>
                Logout
              </Button>
            </>
          )}
          {/* Tidak ada lagi link "Login Admin" di sini */}
        </div>
      </div>
    </div>
  );
}
