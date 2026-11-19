import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import Alert from "../ui/Alert";
import Button from "../ui/Button";
import { Field, Textarea } from "../ui/Field";
import IconTile from "../ui/IconTile";
import Modal from "../ui/Modal";

interface CancelEventModalProps {
  eventId: string | null;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelEventModal({ eventId, onClose, onCancelled }: CancelEventModalProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    setReason("");
    setError("");
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eventId) return;
    if (!reason.trim()) {
      setError(t("UI_CancelReasonRequired"));
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await api.patch(`/events/${eventId}/cancel`, { reason });
      toast.success(t("Student_CancelSuccess"));
      setReason("");
      onCancelled();
    } catch (err) {
      setError(getErrorMessage(err) || t("Student_CancelError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={Boolean(eventId)}
      onClose={close}
      dismissible={!submitting}
      title={t("Student_CancelModalTitle")}
      description={t("Student_CancelModalDescription")}
      icon={
        <IconTile tone="danger">
          <CalendarX2 size={19} />
        </IconTile>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label={t("Student_CancellationReason")} required>
          <Textarea
            rows={4}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
            placeholder={t("Student_CancelReasonPlaceholder")}
          />
        </Field>
        {error && <Alert>{error}</Alert>}
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={close} disabled={submitting}>
            {t("Student_CancelBtn")}
          </Button>
          <Button type="submit" variant="danger" loading={submitting}>
            {submitting ? t("Student_Cancelling") : t("Student_ConfirmCancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
