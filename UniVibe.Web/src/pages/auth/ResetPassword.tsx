import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordRules from "../../components/auth/PasswordRules";
import PasswordInput from "../../components/PasswordInput";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/buttonStyles";
import { Field } from "../../components/ui/Field";
import AuthLayout from "../../layouts/AuthLayout";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { REGISTER_PASSWORD_RULES, meetsPasswordRules } from "../../utils/password";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!email || !token) {
      setError(t("Reset_InvalidLinkError"));
      return;
    }
    if (!meetsPasswordRules(newPassword, REGISTER_PASSWORD_RULES)) {
      setError(t("UI_PasswordRulesUnmet"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("Reset_PasswordMismatch"));
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/Auth/password/reset", { email, token, newPassword });
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err) || t("Reset_DefaultError"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="text-center" role="status">
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700" aria-hidden="true">
            <CircleCheck size={28} />
          </span>
          <h1 className="text-2xl font-bold text-ink-900">{t("Reset_SuccessTitle")}</h1>
          <p className="mt-2 text-sm text-ink-500">{t("Reset_SuccessDesc")}</p>
          <Link to="/login" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("Reset_LoginButton")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t("Reset_Title")}
      description={t("Reset_Description")}
      backTo={{ to: "/login", label: t("Reset_BackToLogin") }}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <div>
          <Field label={t("Reset_NewPasswordLabel")}>
            <PasswordInput
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Field>
          <PasswordRules password={newPassword} rules={REGISTER_PASSWORD_RULES} />
        </div>
        <Field label={t("Reset_ConfirmPasswordLabel")}>
          <PasswordInput
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? t("Reset_Loading") : t("Reset_SubmitButton")}
        </Button>
      </form>
    </AuthLayout>
  );
}
