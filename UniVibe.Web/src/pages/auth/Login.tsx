import { useState } from "react";
import {
  User,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { tokenService } from "../../services/tokenService";

const decodeToken = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberedEmail") !== null);
  const [userType, setUserType] = useState<"admin" | "student">("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isStudent = userType === "student";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("Login_Error_FieldsRequired") || "Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }

    setIsLoading(true);
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
    } else {
      localStorage.removeItem("rememberedEmail");
    }

    try {
      const response = (await api.post("/Auth/login", {
        email,
        password,
      })) as any;
      const token = response.token || response.data?.token;
      const refreshToken = response.refreshToken || response.data?.refreshToken;
      if (!token) throw new Error(t("Login_Error_NoToken"));

      const decoded = decodeToken(token);
      const userRole =
        decoded?.role ||
        decoded?.[
          "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        ];

      const expectedRole = userType === "admin" ? "Admin" : "Student";
      const roleKey = expectedRole === "Admin" ? "Role_Admin" : "Role_Student";

      if (
        !userRole ||
        (Array.isArray(userRole)
          ? !userRole.includes(expectedRole)
          : userRole !== expectedRole)
      ) {
        throw new Error(
          `${t("Login_Error_Unauthorized_Start")}${t(roleKey)}${t("Login_Error_Unauthorized_End")}`
        );
      }
      tokenService.saveTokens(token, refreshToken);
      navigate(
        userType === "admin" ? "/admin/dashboard" : "/student"
      );
    } catch (err: any) {
      const errorMessage =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.message || t("Login_Error_Default");
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">

      <div
        className="auth-card"
      >
        <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
        <div>
          <div className="auth-eyebrow">{t("Login_Eyebrow")}</div>
          <h1 className="auth-title">{t("Login_PageTitle")}</h1>
          <p className="auth-subtitle">{t("Login_PageDescription")}</p>
        </div>

        <div className="auth-role-switch flex bg-gray-100/80 p-1 rounded-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setError("");
              setUserType("student");
            }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 ${isStudent ? "bg-white shadow-sm text-purple-600 font-medium scale-105" : "text-gray-500 hover:text-gray-700"}`}
          >
            <User className="w-4 h-4" /> {t("Login_Student")}
          </button>
          <button
            type="button"
            onClick={() => {
              setError("");
              setUserType("admin");
            }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all duration-300 ${!isStudent ? "bg-white shadow-sm text-blue-600 font-medium scale-105" : "text-gray-500 hover:text-gray-700"}`}
          >
            <ShieldCheck className="w-4 h-4" /> {t("Login_Admin")}
          </button>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form" noValidate>
          <div>
            <label>
              {t("Login_Email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ad.soyad@universite.edu.tr"
            />
          </div>

          <div>
            <div className="auth-password-row">
              <label>
                {t("Login_Password")}
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="auth-options">
            <label className="auth-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Beni hatırla</span>
            </label>
            <button
              type="button"
              onClick={() => {
                navigate("/forgot-password");
              }}
              className="auth-link"
            >
              {t("Login_ForgotPassword")}
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-submit"
          >
            {isLoading ? (
              t("Login_Loading")
            ) : (
              <>
                {t("Login_Button")} <span aria-hidden="true">›</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {t("Login_NoAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                navigate("/register");
              }}
              className="auth-link"
            >
              {t("Login_RegisterLink")}
            </button>
          </p>
          <p className="auth-legal">{t("Auth_Legal")}</p>
        </div>
      </div>

    </div>
  );
}