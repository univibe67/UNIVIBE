import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import FeedbackModal from "../../components/FeedbackModal";
import PasswordInput from "../../components/PasswordInput";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { tokenService } from "../../services/tokenService";
import { normalizeRole } from "../../utils/userRole";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberedEmail") !== null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    const token = tokenService.getAccessToken();
    if (token && !tokenService.isTokenExpired(token, 0)) {
      const role = tokenService.getRole(token);
      if (role === "Admin") {
        navigate("/admin", { replace: true });
      } else if (role) {
        navigate("/", { replace: true });
      }
    } else if (token) {
      tokenService.clearTokens();
    }
  }, [navigate]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError(t("Login_Error_FieldsRequired"));
      return;
    }

    setIsLoading(true);
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", cleanEmail);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      const response = (await api.post("/Auth/login", { email: cleanEmail, password })) as any;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      if (!token) throw new Error(t("Login_Error_NoToken"));

      const roleFromBackend = response.role || response.data?.role;
      const userRole = tokenService.getRole(token) || (roleFromBackend ? normalizeRole(roleFromBackend) : null);
      if (!userRole) throw new Error(t("Login_Error_NoRole"));

      tokenService.saveTokens(token, refreshToken, userRole);
      navigate("/");
    } catch (err) {
      setError(getErrorMessage(err) || t("Login_Error_Default"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("Login_Eyebrow")}
      description={t("UI_LoginDescription")}
      footer={
        <button
          type="button"
          onClick={() => setFeedbackOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-800"
        >
          <MessageSquare size={14} aria-hidden="true" />
          {t("Student_FeedbackButton")}
        </button>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Field label={t("Login_Email")}>
          <Input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ad.soyad@universite.edu.tr"
          />
        </Field>
        <Field label={t("Login_Password")}>
          <PasswordInput
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />
        </Field>

        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-ink-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="size-4 rounded accent-brand-600"
            />
            {t("UI_RememberMe")}
          </label>
          <Link to="/forgot-password" className="rounded text-[13px] font-semibold text-brand-700 hover:underline">
            {t("Login_ForgotPassword")}
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? t("Login_Loading") : t("Login_Button")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {t("Login_NoAccount")}{" "}
        <Link to="/register" className="rounded font-semibold text-brand-700 hover:underline">
          {t("Login_RegisterLink")}
        </Link>
      </p>
      <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">{t("Auth_Legal")}</p>

      <FeedbackModal guest open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </AuthLayout>
  );
}
