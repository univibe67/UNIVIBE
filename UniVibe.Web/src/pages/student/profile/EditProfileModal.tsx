import { useState } from "react";
import { UserRoundPen } from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "../../../components/ui/Alert";
import Button from "../../../components/ui/Button";
import { Field, Input, Textarea } from "../../../components/ui/Field";
import IconTile from "../../../components/ui/IconTile";
import Modal from "../../../components/ui/Modal";
import { api } from "../../../services/api";
import { getErrorMessage } from "../../../services/errorMessage";
import { toast } from "../../../services/toast";
import type { UserProfile } from "./profileTypes";

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileModal({ profile, onClose, onSaved }: EditProfileModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    username: profile.username ?? "",
    bio: profile.bio ?? "",
    socialMediaLink: profile.socialMediaLink ?? "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put("/users/profile", form);
      toast.success(t("UI_ProfileUpdated"));
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err) || t("Student_UpdateError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!saving}
      title={t("Student_EditProfile")}
      icon={
        <IconTile>
          <UserRoundPen size={19} />
        </IconTile>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("Student_FieldUsername")} hint={t("Student_UsernameWarning")}>
          <Input
            value={form.username}
            autoComplete="username"
            onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          />
        </Field>
        <Field label={t("Student_Bio")} counter={{ value: form.bio.length, max: 150 }}>
          <Textarea
            rows={3}
            maxLength={150}
            value={form.bio}
            onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))}
          />
        </Field>
        <Field label={t("Student_SocialMedia")}>
          <Input
            inputMode="url"
            placeholder="https://"
            value={form.socialMediaLink}
            onChange={(event) => setForm((current) => ({ ...current, socialMediaLink: event.target.value }))}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t("Student_CancelBtn")}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? t("Student_Saving") : t("Student_Save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
