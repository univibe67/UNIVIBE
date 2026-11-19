import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordInput from "../../components/PasswordInput";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { tokenService } from "../../services/tokenService";
import { normalizeRole } from "../../utils/userRole";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = tokenService.getAccessToken();
    if (token && !tokenService.isTokenExpired(token) && tokenService.getRole(token) === "Admin") {
      navigate("/admin", { replace: true });
    } else if (token && tokenService.isTokenExpired(token)) {
      tokenService.clearTokens();
    }
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(t("Admin_LoginFieldsRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/login", { email: cleanEmail, password })) as any;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      if (!token || !refreshToken) throw new Error(t("Admin_LoginNoToken"));

      const backendRole = response.role || response.data?.role;
      const role = tokenService.getRole(token) || (backendRole ? normalizeRole(backendRole) : null);
      if (role !== "Admin") {
        tokenService.clearTokens();
        setError(t("Admin_LoginUnauthorized"));
        return;
      }

      tokenService.saveTokens(token, refreshToken, "Admin");
      navigate("/admin", { replace: true });
    } catch (err) {
      tokenService.clearTokens();
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("Admin_LoginTitle")}
      description={t("Admin_LoginDescription")}
      backTo={{ to: "/login", label: t("Admin_BackToUserLogin") }}
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label={t("Admin_LoginEmail")}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("Admin_EmailPlaceholder")}
          />
        </Field>
        <Field label={t("Admin_LoginPassword")}>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t("Admin_PasswordPlaceholder")}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {!isLoading && <ShieldCheck size={18} aria-hidden="true" />}
          {isLoading ? t("Admin_LoginChecking") : t("Admin_LoginButton")}
        </Button>
      </form>
    </AuthLayout>
  );
}
