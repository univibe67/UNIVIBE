import { ArrowRight, CircleCheck, Clock3, MapPin, MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import { formatCategoryName } from "../../utils/categoryLabel";
import { dateParts, formatCardDate } from "../../utils/format";
import { EventStatus, effectiveEventStatus } from "../../utils/eventStatus";
import EventCover from "./EventCover";
import EventStatusBadge from "./EventStatusBadge";

interface EventCardProps {
  event: EventItem;
  onViewDetail: (event: EventItem) => void;
  onOpenComments?: (event: EventItem) => void;
}

export default function EventCard({ event, onViewDetail, onOpenComments }: EventCardProps) {
  const { t, i18n } = useTranslation();
  const parts = dateParts(event.eventDate, i18n.language);
  const showStatus = effectiveEventStatus(event) !== EventStatus.Approved;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-raised hover:ring-brand-200">
      <div className="relative aspect-[16/10] overflow-hidden">
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <EventCover title={event.title} imageUrl={event.imageUrl} categoryName={event.categoryName} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />

        {parts && (
          <div className="absolute top-3 left-3 flex min-w-[52px] flex-col items-center rounded-2xl bg-white/95 px-2.5 py-1.5 shadow-card backdrop-blur" aria-hidden="true">
            <span className="font-display text-[22px] leading-none font-extrabold text-brand-700 tabular-nums">{parts.day}</span>
            <span className="mt-0.5 text-[10px] leading-none font-bold tracking-wide text-coral-500 uppercase">{parts.month}</span>
          </div>
        )}
        {showStatus && (
          <div className="absolute top-3 right-3">
            <EventStatusBadge status={event.status} isDeleted={event.isDeleted} />
          </div>
        )}
        <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-full bg-white/20 px-2.5 py-1 text-xs leading-none font-semibold text-white ring-1 ring-white/35 backdrop-blur-md">
          {formatCategoryName(event.categoryName, t)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[17px] leading-snug font-bold text-ink-900 transition-colors group-hover:text-brand-700">
          <button
            type="button"
            onClick={() => onViewDetail(event)}
            className="text-left after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-500"
          >
            {event.title}
          </button>
        </h3>
        <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-ink-500">
          <Clock3 size={14} className="shrink-0 text-brand-500" aria-hidden="true" />
          <span className="truncate">{formatCardDate(event.eventDate, i18n.language)}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-500">
          <MapPin size={14} className="shrink-0 text-coral-500" aria-hidden="true" />
          <span className="truncate">{event.location || t("Student_NoLocation")}</span>
        </p>

        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between gap-2 border-t border-ink-100 pt-4">
            {event.isCreator ? (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs leading-none font-bold text-brand-700 ring-1 ring-brand-100">
                {t("UI_YourEvent")}
              </span>
            ) : event.isJoined ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs leading-none font-bold text-emerald-700 ring-1 ring-emerald-200">
                <CircleCheck size={13} aria-hidden="true" />
                {t("UI_Joined")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600">
                {t("Student_ViewDetails")}
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            )}
            <button
              type="button"
              onClick={() => (onOpenComments ?? onViewDetail)(event)}
              aria-label={`${t("Event_CommentsButton")}: ${event.title}`}
              title={t("Event_CommentsButton")}
              className="relative z-10 grid size-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-500 ring-1 ring-ink-200/70 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
            >
              <MessageCircle size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
