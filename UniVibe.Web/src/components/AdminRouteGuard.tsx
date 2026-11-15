import { Navigate, Outlet } from "react-router-dom";
import { tokenService } from "../services/tokenService";

export default function AdminRouteGuard() {
  const token = tokenService.getAccessToken();
  const isAdmin = tokenService.getRole(token ?? undefined) === "Admin";

  return token && isAdmin ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
