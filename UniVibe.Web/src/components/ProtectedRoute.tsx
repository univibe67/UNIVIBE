import { Navigate, Outlet } from 'react-router-dom';
import { tokenService } from '../services/tokenService';

import type { UserRole } from "../utils/userRole";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  redirectPath = "/login",
}: ProtectedRouteProps) {
  const token = tokenService.getAccessToken();

  if (!token) {
    return <Navigate to={redirectPath} replace />;
  }

  const userRole = tokenService.getRole(token);
  if (!userRole) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Admin rotası için admin rolü yoksa admin giriş ekranına, diğer durumlarda ana sayfaya yönlendir
    return <Navigate to={redirectPath === "/admin/login" ? "/admin/login" : "/"} replace />;
  }

  return <Outlet />;
}
