import { useState, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { tokenService } from "../../services/tokenService";
import { getErrorMessage } from "../../services/errorMessage";
import { normalizeRole } from "../../utils/userRole";
import { useTranslation } from "react-i18next";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = tokenService.getAccessToken();
    if (token && tokenService.getRole(token) === "Admin") {
      navigate("/admin", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("Admin_LoginFieldsRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/login", { email, password })) as any;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      if (!token || !refreshToken) {
        throw new Error(t("Admin_LoginNoToken"));
      }

      const backendRole = response.role || response.data?.role;
      const role =
        tokenService.getRole(token) ||
        (backendRole ? normalizeRole(backendRole) : null);
      const isAdmin = role === "Admin";

      if (!isAdmin) {
        tokenService.clearTokens();
        setError(t("Admin_LoginUnauthorized"));
        return;
      }

      tokenService.saveTokens(token, refreshToken, "Admin");
      navigate("/admin", { replace: true });
    } catch (loginError) {
      tokenService.clearTokens();
      setError(getErrorMessage(loginError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-lockup" translate="no">
          <span className="brand-mark">U</span>
          <span>Uni<strong>Vibe</strong></span>
        </div>

        <div>
          <div className="auth-eyebrow">{t("Admin_LoginEyebrow")}</div>
          <h1 className="auth-title">{t("Admin_LoginTitle")}</h1>
          <p className="auth-subtitle">{t("Admin_LoginDescription")}</p>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          <div>
            <label htmlFor="admin-email">{t("Admin_LoginEmail")}</label>
            <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("Admin_EmailPlaceholder")} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="admin-password">{t("Admin_LoginPassword")}</label>
            <input id="admin-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t("Admin_PasswordPlaceholder")} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={isLoading} className="auth-submit">
            {isLoading ? t("Admin_LoginChecking") : <><ShieldCheck size={17} /> {t("Admin_LoginButton")} <span aria-hidden="true">›</span></>}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" onClick={() => navigate("/login")} className="auth-link">{t("Admin_BackToUserLogin")}</button>
        </div>
      </div>
    </div>
  );
}
