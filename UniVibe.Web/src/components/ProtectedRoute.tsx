import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { tokenService } from "../services/tokenService";
import { requestTokenRefresh } from "../services/api";
import type { UserRole } from "../utils/userRole";
import FullPageLoader from "./ui/FullPageLoader";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  redirectPath?: string;
}

export default function ProtectedRoute({
  allowedRoles,
  redirectPath = "/login",
}: ProtectedRouteProps) {
  const token = tokenService.getAccessToken();
  const refreshToken = tokenService.getRefreshToken();
  const hasToken = Boolean(token && token !== "undefined" && token !== "null" && token.trim().length > 0);
  const hasRefresh = Boolean(refreshToken && refreshToken !== "undefined" && refreshToken !== "null" && refreshToken.trim().length > 0);
  
  // Instant client-side JWT exp decode with 30s buffer
  const isExpired = !hasToken || tokenService.isTokenExpired(token, 30);
  const hasAnySession = hasToken || hasRefresh;
  const needsRefresh = hasRefresh && isExpired;

  const [isVerifying, setIsVerifying] = useState<boolean>(() => {
    if (!hasAnySession) return false;
    if (needsRefresh) return true;
    return false;
  });

  const [authFailed, setAuthFailed] = useState<boolean>(false);
  const refreshAttemptedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    if (needsRefresh && !refreshAttemptedRef.current) {
      refreshAttemptedRef.current = true;
      requestTokenRefresh()
        .then(() => {
          if (isMounted) {
            setIsVerifying(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            tokenService.clearTokens();
            setAuthFailed(true);
            setIsVerifying(false);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [needsRefresh]);

  // 1. If no session tokens exist at all, or verification failed -> redirect immediately without rendering children
  if (!hasAnySession || authFailed) {
    tokenService.clearTokens();
    return <Navigate to={redirectPath} replace />;
  }

  // 2. If access token is expired and there is no refresh token -> redirect immediately without rendering children
  if (isExpired && !hasRefresh) {
    tokenService.clearTokens();
    return <Navigate to={redirectPath} replace />;
  }

  // 3. While actively verifying/refreshing token, show neutral loader (NEVER mount StudentHome / Outlet)
  if (isVerifying) {
    return <FullPageLoader />;
  }

  // 4. Double check token validity after verification completes
  const currentToken = tokenService.getAccessToken();
  if (!currentToken || tokenService.isTokenExpired(currentToken, 0)) {
    tokenService.clearTokens();
    return <Navigate to={redirectPath} replace />;
  }

  // 5. Check role authorization
  const userRole = tokenService.getRole(currentToken);
  if (!userRole) {
    tokenService.clearTokens();
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={redirectPath === "/admin/login" ? "/admin/login" : "/"} replace />;
  }

  return <Outlet />;
}
