import { Navigate, Outlet } from 'react-router-dom';
import { tokenService } from '../services/tokenService';

import type { UserRole } from "../utils/userRole";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = tokenService.getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const userRole = tokenService.getRole(token);
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}