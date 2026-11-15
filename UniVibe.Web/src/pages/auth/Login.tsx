import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  MessageSquare,
  X,
  AlertTriangle,
  Loader2,
  Send,
} from "lucide-react";
import { api } from "../../services/api";
import { tokenService } from "../../services/tokenService";
import { getErrorMessage } from "../../services/errorMessage";
import { normalizeRole } from "../../utils/userRole";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem("rememberedEmail") !== null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Geri bildirim modalı state'leri
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [feedbackError, setFeedbackError] = useState("");
  const [feedbackSuccess, setFeedbackSuccess] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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

      const roleFromBackend = response.role || response.data?.role;
      const userRole =
        tokenService.getRole(token) ||
        (roleFromBackend ? normalizeRole(roleFromBackend) : null);
      if (!userRole) throw new Error(t("Login_Error_NoRole") || "Geçerli kullanıcı rolü alınamadı.");

      tokenService.saveTokens(token, refreshToken, userRole);
      navigate("/");
    } catch (err: any) {
      setError(getErrorMessage(err) || t("Login_Error_Default"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    const contactEmail = feedbackForm.email.trim();
    const subject = feedbackForm.subject.trim();
    const message = feedbackForm.message.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail || !emailRegex.test(contactEmail)) {
      setFeedbackError(
        t("Feedback_EmailInvalid") || "Lütfen geçerli bir e-posta adresi giriniz.",
      );
      return;
    }

    if (subject.length < 3) {
      setFeedbackError(
        t("Feedback_SubjectMinLength") || "Konu en az 3 karakter olmalıdır.",
      );
      return;
    }
    if (subject.length > 100) {
      setFeedbackError("Konu en fazla 100 karakter olmalıdır.");
      return;
    }
    if (message.length < 10) {
      setFeedbackError(
        t("Feedback_MessageMinLength") || "Mesaj en az 10 karakter olmalıdır.",
      );
      return;
    }
    if (message.length > 1000) {
      setFeedbackError("Mesaj en fazla 1000 karakter olmalıdır.");
      return;
    }

    setIsSubmittingFeedback(true);
    setFeedbackError("");

    // Backend DTO'sunda doğrudan ayrı bir e-posta alanı bulunmadığından
    // mesaj içeriğine "[Gönderen E-posta: ...]" formatında eklenerek gönderilir
    const enrichedMessage = `[Gönderen E-posta: ${contactEmail}]\n\n${message}`;

    try {
      const response = (await api.post(
        "/feedbacks",
        {
          email: contactEmail,
          subject,
          message: enrichedMessage,
        },
        {
          headers: { "X-Skip-Auth-Redirect": "true" },
        },
      )) as any;

      const successMsg =
        (typeof response === "string" && response) ||
        response?.data?.message ||
        response?.message ||
        t("Res_Feedback_Created") ||
        "Geri bildiriminiz başarıyla iletildi.";

      setFeedbackSuccess(successMsg);
      setTimeout(() => {
        setFeedbackModalOpen(false);
        setFeedbackSuccess("");
        setFeedbackForm({ email: "", subject: "", message: "" });
      }, 1500);
    } catch (err: any) {
      console.error("Geri bildirim gönderilemedi:", err);
      setFeedbackError(getErrorMessage(err));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
        <div>
          <div className="auth-eyebrow">{t("Login_Eyebrow")}</div>
          <h1 className="auth-title">{t("Login_PageTitle")}</h1>
          <p className="auth-subtitle">{t("Login_PageDescription")}</p>
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

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setFeedbackForm({ email: "", subject: "", message: "" });
                setFeedbackError("");
                setFeedbackSuccess("");
                setFeedbackModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 font-medium transition-colors cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>{t("Student_FeedbackButton") || "Geri Bildirim / Sorun Bildir"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Giriş Ekranı Geri Bildirim Modalı */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative text-left">
            <button
              type="button"
              onClick={() => setFeedbackModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b pb-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MessageSquare size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-snug">
                  {t("Feedback_ModalTitle") || "Geri Bildirim / Sorun Bildir"}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {t("Feedback_ModalDescription") ||
                    "Sorun, öneri veya taleplerinizi bize iletebilirsiniz."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  {t("Feedback_Email") || "E-posta Adresiniz"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={feedbackForm.email}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, email: e.target.value })
                  }
                  placeholder={
                    t("Feedback_EmailPlaceholder") || "ad.soyad@universite.edu.tr"
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Feedback_Subject") || "Konu"} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {feedbackForm.subject.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  value={feedbackForm.subject}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, subject: e.target.value })
                  }
                  placeholder={
                    t("Feedback_SubjectPlaceholder") ||
                    "Örn: Giriş yaparken hata alıyorum"
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {t("Feedback_Message") || "Mesajınız / Açıklama"} <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {feedbackForm.message.length}/1000
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  maxLength={1000}
                  value={feedbackForm.message}
                  onChange={(e) =>
                    setFeedbackForm({ ...feedbackForm, message: e.target.value })
                  }
                  placeholder={
                    t("Feedback_MessagePlaceholder") ||
                    "Sorun veya önerinizi detaylı bir şekilde açıklayın (en az 10 karakter)..."
                  }
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 resize-none transition-colors"
                />
              </div>

              {feedbackError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-red-600" />
                  <span>{feedbackError}</span>
                </div>
              )}

              {feedbackSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
                  {feedbackSuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModalOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer"
                >
                  {t("Auth_Cancel") || "İptal"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingFeedback ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>{t("Feedback_Sending") || "Gönderiliyor..."}</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{t("Feedback_Send") || "Gönder"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
