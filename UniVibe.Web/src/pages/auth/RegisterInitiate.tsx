import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";

export default function RegisterInitiate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    if (!email) {
      setMessage({ type: "error", text: t("Register_EmailRequired") });
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/register-init", {
        email,
        targetUrl: `${window.location.origin}/register-complete`,
      })) as any;
      setMessage({
        type: "success",
        text: response.message || response.data?.message || t("Register_SuccessMessage"),
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || error?.message || t("Register_ErrorMessage"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <main className="auth-card auth-forgot-card">
        <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
        <button type="button" className="auth-back" onClick={() => navigate("/")}>
          <span aria-hidden="true">‹</span> {t("Register_BackToLogin")}
        </button>
        <div className="auth-forgot-heading">
          <div className="auth-eyebrow">{t("Register_Eyebrow")}</div>
          <h1 className="auth-title">{t("Register_PageTitle")}</h1>
          <p className="auth-subtitle">{t("Register_PageDescription")}</p>
        </div>
        {message.text && <div className={message.type === "success" ? "auth-success" : "auth-error"}>{message.text}</div>}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div>
            <label htmlFor="register-email">{t("Login_Email")}</label>
            <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ad.soyad@universite.edu.tr" />
          </div>
          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? t("Register_Sending") : t("Register_PageSubmit")} <span aria-hidden="true">›</span>
          </button>
        </form>
        <button type="button" className="auth-simulate-link" onClick={() => navigate(`/register-complete?token=simulation-token`)}>
          {t("Register_SimulateLink")}
        </button>
        <p className="auth-legal">{t("Auth_Legal")}</p>
      </main>
    </div>
  );
}
