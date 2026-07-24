import { Navigate, Outlet } from 'react-router-dom';
import { tokenService } from '../services/tokenService';

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

interface ProtectedRouteProps {
  allowedRole: 'Admin' | 'Student';
}

export default function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const token = tokenService.getAccessToken();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  const decoded = decodeToken(token);
  const userRole = decoded?.role || decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (!userRole || (Array.isArray(userRole) ? !userRole.includes(allowedRole) : userRole !== allowedRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}