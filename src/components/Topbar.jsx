import Button from "./Button";
import { NavLink, Link } from "react-router-dom";

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

          {admin ? (
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
                to="/admin/locations"
                className={({ isActive }) =>
                  `${linkClass} ${isActive ? activeClass : ""}`
                }
              >
                Lokasi
              </NavLink>

              <span className="text-neutral-600">|</span>
              <span className="text-neutral-400">{admin.email}</span>
              <Button onClick={onLogout}>Logout</Button>
            </>
          ) : (
            <Link to="/admin/login" className="text-blue-400 underline">
              Login Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
