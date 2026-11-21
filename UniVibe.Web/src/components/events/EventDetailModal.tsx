import { MessageCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import { EventStatus, effectiveEventStatus } from "../../utils/eventStatus";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Skeleton from "../ui/Skeleton";
import EventActions from "./EventActions";
import EventCover from "./EventCover";
import EventFacts from "./EventFacts";
import EventReasons from "./EventReasons";
import EventStatusBadge from "./EventStatusBadge";

interface EventDetailModalProps {
  event: EventItem | null;
  loading: boolean;
  joining: boolean;
  leaving: boolean;
  onClose: () => void;
  onJoin: (eventId: string) => void;
  onLeave: (eventId: string) => void;
  onOpenComments: (event: EventItem) => void;
  onCancelEvent?: (eventId: string) => void;
}

export default function EventDetailModal({
  event,
  loading,
  joining,
  leaving,
  onClose,
  onJoin,
  onLeave,
  onOpenComments,
  onCancelEvent,
}: EventDetailModalProps) {
  const { t } = useTranslation();
  if (!event) return null;

  const status = effectiveEventStatus(event);
  const showStatus = status !== EventStatus.Approved;
  const canCancel = Boolean(event.isCreator && onCancelEvent && status !== EventStatus.Cancelled);

  return (
    <Modal
      open
      bare
      size="lg"
      ariaLabel={event.title}
      onClose={onClose}
      footer={
        loading ? undefined : (
          <>
            <Button variant="secondary" onClick={() => onOpenComments(event)}>
              <MessageCircle size={16} aria-hidden="true" />
              {t("Event_CommentsButton")}
            </Button>
            <EventActions
              event={event}
              joining={joining}
              leaving={leaving}
              onJoin={() => onJoin(event.id)}
              onLeave={() => onLeave(event.id)}
            />
            {canCancel && (
              <Button
                variant="dangerSoft"
                onClick={() => {
                  onClose();
                  onCancelEvent?.(event.id);
                }}
              >
                <XCircle size={16} aria-hidden="true" />
                {t("Student_CancelEventBtn")}
              </Button>
            )}
          </>
        )
      }
    >
      <div className="aspect-[2/1] max-h-64 w-full overflow-hidden bg-ink-100">
        <EventCover title={event.title} imageUrl={event.imageUrl} categoryName={event.categoryName} iconSize={56} />
      </div>
      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div>
          {showStatus && <EventStatusBadge status={event.status} isDeleted={event.isDeleted} className="mb-2.5" />}
          <h2 className="text-[26px] leading-tight font-extrabold text-ink-900 sm:text-[32px]">{event.title}</h2>
        </div>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <EventReasons event={event} />
            <EventFacts event={event} />
            <section className="border-t border-ink-100 pt-5">
              <h3 className="text-sm font-semibold text-ink-900">{t("Student_EventDescription")}</h3>
              <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-ink-600">
                {event.description || t("Student_NoEventDescription")}
              </p>
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}