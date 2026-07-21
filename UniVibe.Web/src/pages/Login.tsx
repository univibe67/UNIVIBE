import { useState } from "react";
import {
  Mail,
  Lock,
  LogIn,
  User,
  ShieldCheck,
  Key,
  X,
  Send,
  CheckCircle,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { tokenService } from "../services/tokenService";
import LanguageSelector from "../components/LanguageSelector";
import AuthModal from "../components/AuthModal";

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
  } catch (e) {
    return null;
  }
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"admin" | "student">("student");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ type: "", text: "" });

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState({
    type: "",
    text: "",
  });

  const isStudent = userType === "student";
  const bgClass = isStudent
    ? "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"
    : "bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500";
  const boxClass = isStudent ? "shadow-purple-500/20" : "shadow-blue-500/20";
  const titleClass = isStudent
    ? "from-purple-600 to-pink-600"
    : "from-blue-600 to-purple-600";
  const buttonClass = isStudent
    ? "from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-pink-500/30"
    : "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-blue-700 shadow-blue-500/30";
  const focusRingClass = isStudent
    ? "focus:ring-purple-500 focus:border-purple-500"
    : "focus:ring-blue-500 focus:border-blue-500";
  const textColorClass = isStudent
    ? "text-purple-600 hover:text-purple-800"
    : "text-blue-600 hover:text-blue-800";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError(t("Login_Error_FieldsRequired") || "Lütfen e-posta ve şifre alanlarını doldurun.");
      return;
    }

    setIsLoading(true);

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
        userType === "admin" ? "/admin/dashboard" : "/student/dashboard"
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage({ type: "", text: "" });

    setForgotLoading(true);

    try {
      const resetUrl = `${window.location.origin}/reset-password`;
      const response = (await api.post("/Auth/forgot-password", {
        email: forgotEmail,
        resetUrl,
      })) as any;
      setForgotMessage({
        type: "success",
        text:
          response.message ||
          response.data?.message ||
          t("Forgot_SuccessMessage"),
      });
    } catch (err: any) {
      setForgotMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          err.message ||
          t("Forgot_ErrorMessage"),
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterMessage({ type: "", text: "" });

    setRegisterLoading(true);

    try {
      const targetUrl = `${window.location.origin}/register-complete`;
      const response = (await api.post("/Auth/register-init", {
        email: registerEmail,
        targetUrl,
      })) as any;
      setRegisterMessage({
        type: "success",
        text:
          response.message ||
          response.data?.message ||
          t("Register_SuccessMessage"),
      });
    } catch (err: any) {
      const backendMessage = err.response?.data?.message || err.message;
      setRegisterMessage({
        type: "error",
        text: backendMessage || t("Register_ErrorMessage"),
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen relative flex items-center justify-center p-4 transition-all duration-700 ease-in-out ${bgClass}`}
    >
      <LanguageSelector />

      <div
        className={`max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-2xl transition-all duration-500 ${boxClass}`}
      >
        <div className="text-center space-y-2">
          <h1
            className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r transition-colors duration-500 ${titleClass}`}
          >
            UniVibe
          </h1>
          <p className="text-gray-500">{t("Login_SelectType")}</p>
        </div>

        <div className="flex bg-gray-100/80 p-1 rounded-lg backdrop-blur-md">
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
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              {t("Login_Email")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-all ${focusRingClass}`}
                placeholder="ornek@univibe.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                {t("Login_Password")}
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotMessage({ type: "", text: "" });
                  setIsForgotOpen(true);
                }}
                className={`text-xs font-semibold hover:underline transition-colors ${textColorClass}`}
              >
                {t("Login_ForgotPassword")}
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-all ${focusRingClass}`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-gradient-to-r text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md disabled:opacity-70 ${buttonClass}`}
          >
            {isLoading ? (
              t("Login_Loading")
            ) : (
              <>
                <LogIn className="w-5 h-5" /> {t("Login_Button")}
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            {t("Login_NoAccount")}{" "}
            <button
              type="button"
              onClick={() => {
                setRegisterEmail("");
                setRegisterMessage({ type: "", text: "" });
                setIsRegisterOpen(true);
              }}
              className={`font-semibold hover:underline ${textColorClass}`}
            >
              {t("Login_RegisterLink")}
            </button>
          </p>
        </div>
      </div>

      <AuthModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        title={t("Forgot_Title")}
        description={t("Forgot_Description")}
        icon={<Key className="w-6 h-6 text-white" />}
        titleClass={titleClass}
      >
        {forgotMessage.text && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 flex items-start gap-2 ${forgotMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
          >
            {forgotMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <X className="w-5 h-5 shrink-0" />
            )}
            <p>{forgotMessage.text}</p>
          </div>
        )}
        {forgotMessage.type !== "success" && (
          <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 outline-none ${focusRingClass}`}
                placeholder="ornek@univibe.com"
              />
            </div>
            <button
              type="submit"
              disabled={forgotLoading}
              className={`w-full bg-gradient-to-r text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-70 ${buttonClass}`}
            >
              {forgotLoading ? (
                t("Forgot_Sending")
              ) : (
                <>
                  <Send className="w-4 h-4" /> {t("Forgot_SendButton")}
                </>
              )}
            </button>
          </form>
        )}
        {forgotMessage.type === "success" && (
          <button
            onClick={() => setIsForgotOpen(false)}
            className="w-full mt-2 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-200"
          >
            {t("Forgot_CloseButton")}
          </button>
        )}
      </AuthModal>

      <AuthModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title={t("Register_ModalTitle")}
        description={t("Register_ModalDesc")}
        icon={<UserPlus className="w-6 h-6 text-white" />}
        titleClass={titleClass}
      >
        {registerMessage.text && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 flex items-start gap-2 ${registerMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
          >
            {registerMessage.type === "success" ? (
              <CheckCircle className="w-5 h-5 shrink-0" />
            ) : (
              <X className="w-5 h-5 shrink-0" />
            )}
            <p>{registerMessage.text}</p>
          </div>
        )}
        {registerMessage.type !== "success" && (
          <form onSubmit={handleRegisterInitiate} className="space-y-4" noValidate>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 outline-none transition-all ${focusRingClass}`}
                placeholder="ornek@univibe.com"
              />
            </div>
            <button
              type="submit"
              disabled={registerLoading}
              className={`w-full bg-gradient-to-r text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-70 ${buttonClass}`}
            >
              {registerLoading ? (
                t("Register_Sending")
              ) : (
                <>
                  <Send className="w-4 h-4" /> {t("Register_SendButton")}
                </>
              )}
            </button>
          </form>
        )}
        {registerMessage.type === "success" && (
          <button
            onClick={() => setIsRegisterOpen(false)}
            className="w-full mt-2 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-200"
          >
            {t("Forgot_CloseButton")}
          </button>
        )}
      </AuthModal>
    </div>
  );
}