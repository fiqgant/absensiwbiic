import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./auth/useAuth";
import PrivateRoute from "./auth/PrivateRoute";
import Topbar from "./components/Topbar";

// pages
import Home from "./pages/student/Home";
import Login from "./pages/admin/Login";
import Locations from "./pages/admin/Locations";
import Attendance from "./pages/admin/Attendance";
import Compare from "./pages/admin/Compare";
import Report from "./pages/admin/Report";
import { Analytics } from "@vercel/analytics/react";

export default function App() {
  const { ready, admin, setToken, reload } = useAuth();

  const onLogin = (token) => {
    setToken(token);
    reload();
  };
  const onLogout = () => {
    setToken(null);
    reload();
  };

  return (
    <div className="min-h-screen">
      <Analytics />
      <Topbar admin={admin} onLogout={onLogout} />
      <Routes>
        {/* Mahasiswa */}
        <Route path="/" element={<Home />} />

        {/* Admin */}
        <Route path="/admin/login" element={<Login onLogin={onLogin} />} />
        <Route element={<PrivateRoute ready={ready} admin={admin} />}>
          <Route
            path="/admin"
            element={<Navigate to="/admin/attendance" replace />}
          />
          <Route path="/admin/attendance" element={<Attendance />} />
          <Route path="/admin/locations" element={<Locations />} />
          <Route path="/admin/compare" element={<Compare />} />
          <Route path="/admin/report" element={<Report />} />
        </Route>

        <Route
          path="*"
          element={<div className="p-6 text-neutral-400">404</div>}
        />
      </Routes>
    </div>
  );
}
