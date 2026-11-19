import { useState } from "react";
import { useTranslation } from "react-i18next";
import EmailSentNotice from "../../components/auth/EmailSentNotice";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { Field, Input } from "../../components/ui/Field";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";

export default function RegisterInitiate() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError(t("Register_EmailRequired"));
      return;
    }

    setIsLoading(true);
    try {
      const response = (await api.post("/Auth/register/init", {
        email: cleanEmail,
        targetUrl: `${window.location.origin}/register-complete`,
      })) as any;
      setSuccess(response.message || response.data?.message || t("Register_SuccessMessage"));
    } catch (err) {
      setError(getErrorMessage(err) || t("Register_ErrorMessage"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("Register_PageTitle")}
      description={t("Register_PageDescription")}
      backTo={{ to: "/login", label: t("Register_BackToLogin") }}
    >
      {success ? (
        <EmailSentNotice title={success} text={t("Register_CheckEmail")} />
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
            {isLoading ? t("Register_Sending") : t("Register_PageSubmit")}
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-xs leading-relaxed text-ink-500">{t("Auth_Legal")}</p>
    </AuthLayout>
  );
}
