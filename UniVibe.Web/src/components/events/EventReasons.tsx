import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import Alert from "../ui/Alert";

export default function EventReasons({ event }: { event: EventItem }) {
  const { t } = useTranslation();
  if (!event.rejectionReason && !event.cancellationReason) return null;

  return (
    <div className="space-y-3">
      {event.rejectionReason && (
        <Alert tone="error" title={t("Student_RejectionReason")}>
          {event.rejectionReason}
        </Alert>
      )}
      {event.cancellationReason && (
        <Alert tone="warning" title={t("Student_CancellationReason")}>
          {event.cancellationReason}
        </Alert>
      )}
    </div>
  );
}
