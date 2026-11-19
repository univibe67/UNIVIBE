import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { getErrorMessage } from "../services/errorMessage";
import { toast } from "../services/toast";
import Alert from "./ui/Alert";
import Button from "./ui/Button";
import { Field, Input, Textarea } from "./ui/Field";
import IconTile from "./ui/IconTile";
import Modal from "./ui/Modal";

interface FeedbackModalProps {
  open: boolean;
  guest?: boolean;
  onClose: () => void;
}

const EMPTY_FORM = { email: "", subject: "", message: "" };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FeedbackModal({ open, guest = false, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setForm(EMPTY_FORM);
    setError("");
    onClose();
  };

  const validate = (email: string, subject: string, message: string): string => {
    if (guest && !EMAIL_PATTERN.test(email)) return t("Feedback_EmailInvalid");
    if (subject.length < 3) return t("Feedback_SubjectMinLength");
    if (subject.length > 100) return t("UI_FeedbackSubjectMax");
    if (message.length < 10) return t("Feedback_MessageMinLength");
    if (message.length > 1000) return t("UI_FeedbackMessageMax");
    return "";
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    const validationError = validate(email, subject, message);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = (await api.post(
        "/feedbacks",
        guest
          ? // Backend DTO'sunda ayrı e-posta alanı olmadığından adres mesajın başına eklenir
            { email, subject, message: `[Gönderen E-posta: ${email}]\n\n${message}` }
          : { subject, message },
        guest ? { headers: { "X-Skip-Auth-Redirect": "true" } } : undefined,
      )) as unknown;

      const serverMessage =
        typeof response === "string" ? response : (response as { message?: string } | null)?.message;
      toast.success(serverMessage || t("Feedback_Success"));
      close();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={!submitting}
      title={t("Feedback_ModalTitle")}
      description={t("Feedback_ModalDescription")}
      icon={
        <IconTile>
          <MessageSquare size={19} />
        </IconTile>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {!guest && <Alert tone="info">{t("Feedback_DailyLimitNotice")}</Alert>}
        {guest && (
          <Field label={t("Feedback_Email")} required>
            <Input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder={t("Feedback_EmailPlaceholder")}
            />
          </Field>
        )}
        <Field label={t("Feedback_Subject")} required counter={{ value: form.subject.length, max: 100 }}>
          <Input
            maxLength={100}
            value={form.subject}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            placeholder={t("Feedback_SubjectPlaceholder")}
          />
        </Field>
        <Field label={t("Feedback_Message")} required counter={{ value: form.message.length, max: 1000 }}>
          <Textarea
            rows={4}
            maxLength={1000}
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            placeholder={t("Feedback_MessagePlaceholder")}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close} disabled={submitting}>
            {t("Auth_Cancel")}
          </Button>
          <Button type="submit" loading={submitting}>
            {!submitting && <Send size={16} aria-hidden="true" />}
            {submitting ? t("Feedback_Sending") : t("Feedback_Send")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
