import { Navigate, Outlet } from "react-router-dom";

export default function PrivateRoute({ ready, admin }) {
  if (!ready)
    return <div className="p-6 text-sm text-neutral-400">Loading...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
