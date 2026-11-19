import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import PasswordInput from "../../../components/PasswordInput";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import { Field } from "../../../components/ui/Field";
import IconTile from "../../../components/ui/IconTile";
import Modal from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { getErrorMessage } from "../../../services/errorMessage";
import { toast } from "../../../services/toast";
import { tokenService } from "../../../services/tokenService";
import type { UserProfile } from "./profileTypes";

export default function DeleteAccountModal({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!password.trim()) {
      setError(t("UI_PasswordRequired"));
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const identifier = profile.email || profile.username;
      if (identifier) {
        try {
          await api.post("/Auth/login", { email: identifier, password });
        } catch {
          setError(t("Auth_InvalidPassword"));
          setDeleting(false);
          return;
        }
      }

      await api.delete("/users/account");
      toast.success(t("Auth_DeleteAccountSuccess"));
      window.setTimeout(() => {
        tokenService.clearTokens();
        window.location.href = "/";
      }, 1200);
    } catch (err) {
      setError(getErrorMessage(err) || t("Student_DeleteAccountError"));
      setDeleting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!deleting}
      title={t("Auth_DeleteAccountTitle")}
      description={t("Auth_DeleteAccountSubtitle")}
      icon={
        <IconTile tone="danger">
          <Trash2 size={19} />
        </IconTile>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Alert tone="warning" title={t("Auth_DeleteAccountNoticeTitle")}>
          {t("Auth_DeleteAccountNotice")}
        </Alert>
        <Field label={t("Auth_DeleteAccountPasswordLabel")} hint={t("Auth_DeleteAccountPasswordHint")} required>
          <PasswordInput
            required
            autoComplete="current-password"
            value={password}
            placeholder={t("Auth_DeleteAccountPasswordPlaceholder")}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError("");
            }}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            {t("Auth_Cancel")}
          </Button>
          <Button type="submit" variant="danger" disabled={!password.trim()} loading={deleting}>
            {deleting ? t("Auth_DeletingAccount") : t("Auth_DeleteAccountConfirmBtn")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
