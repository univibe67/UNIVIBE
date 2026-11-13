import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email) {
      setMessage({
        type: "error",
        text: t("Forgot_EmailRequired") || "Lütfen e-posta adresinizi girin.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/forgot-password", {
        email,
        resetUrl: `${window.location.origin}/reset-password`,
      })) as any;

      setMessage({
        type: "success",
        text: response.message || response.data?.message || t("Forgot_SuccessMessage"),
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          t("Forgot_ErrorMessage") ||
          "E-posta gönderilirken bir hata oluştu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <main className="auth-card auth-forgot-card">
        <div className="brand-lockup">
          <span className="brand-mark">U</span>
          <span>Uni<strong>Vibe</strong></span>
        </div>

        <button type="button" className="auth-back" onClick={() => navigate("/")}>
          <span aria-hidden="true">‹</span> {t("Forgot_BackToLogin")}
        </button>

        <div className="auth-forgot-heading">
          <div className="auth-eyebrow">{t("Forgot_Eyebrow")}</div>
          <h1 className="auth-title">{t("Forgot_PageTitle")}</h1>
          <p className="auth-subtitle">{t("Forgot_PageDescription")}</p>
        </div>

        {message.text && (
          <div className={message.type === "success" ? "auth-success" : "auth-error"}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div>
            <label htmlFor="forgot-email">{t("Login_Email")}</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ad.soyad@universite.edu.tr"
            />
          </div>
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? t("Forgot_Sending") : t("Forgot_PageSubmit")} <span aria-hidden="true">›</span>
          </button>
        </form>

        <button
          type="button"
          className="auth-simulate-link"
          onClick={() =>
            navigate(`/reset-password?email=${encodeURIComponent(email)}&token=simulation-token`)
          }
        >
          {t("Forgot_SimulateLink")}
        </button>
        <p className="auth-legal">{t("Auth_Legal")}</p>
      </main>
    </div>
  );
}
