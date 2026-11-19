import { useState } from "react";
import { useTranslation } from "react-i18next";
import EmailSentNotice from "../../components/auth/EmailSentNotice";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState(() => localStorage.getItem("rememberedEmail") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("Forgot_EmailRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/password/forgot", {
        email: cleanEmail,
        resetUrl: `${window.location.origin}/reset-password`,
      })) as any;
      setSuccess(response.message || response.data?.message || t("Forgot_SuccessMessage"));
    } catch (err) {
      setError(getErrorMessage(err) || t("Forgot_ErrorMessage"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("Forgot_PageTitle")}
      description={t("Forgot_PageDescription")}
      backTo={{ to: "/login", label: t("Forgot_BackToLogin") }}
    >
      {success ? (
        <EmailSentNotice title={success} text={t("Forgot_CheckEmail")} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
          <Button type="submit" size="lg" className="w-full" loading={isLoading}>
            {isLoading ? t("Forgot_Sending") : t("Forgot_PageSubmit")}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
