import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordRules from "../../../components/auth/PasswordRules";
import PasswordInput from "../../../components/PasswordInput";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import IconTile from "../../../components/ui/IconTile";
import Modal from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { getErrorMessage } from "../../../services/errorMessage";
import { toast } from "../../../services/toast";
import { CHANGE_PASSWORD_RULES, meetsPasswordRules } from "../../../utils/password";

export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!meetsPasswordRules(form.newPassword, CHANGE_PASSWORD_RULES)) {
      setError(t("UI_PasswordRulesUnmet"));
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(t("Reset_PasswordMismatch"));
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.post("/users/password/change", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success(t("Student_PasswordChanged"));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err) || t("Student_PasswordChangeError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!saving}
      title={t("Student_ChangePassword")}
      description={t("Reset_Description")}
      icon={
        <IconTile>
          <LockKeyhole size={19} />
        </IconTile>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("Student_CurrentPassword")} required>
          <PasswordInput
            required
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={update("currentPassword")}
          />
        </Field>
        <div>
          <Field label={t("Student_NewPassword")} required>
            <PasswordInput required autoComplete="new-password" value={form.newPassword} onChange={update("newPassword")} />
          </Field>
          <PasswordRules password={form.newPassword} rules={CHANGE_PASSWORD_RULES} />
        </div>
        <Field label={t("Student_ConfirmNewPassword")} required>
          <PasswordInput
            required
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={update("confirmPassword")}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("Auth_Cancel")}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? t("Student_Saving") : t("Student_Save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
