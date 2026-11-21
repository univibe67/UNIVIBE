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
  compact?: boolean;
  onViewDetail: (event: EventItem) => void;
  onOpenComments?: (event: EventItem) => void;
}

export default function EventCard({ event, compact = false, onViewDetail, onOpenComments }: EventCardProps) {
  const { t, i18n } = useTranslation();
  const parts = dateParts(event.eventDate, i18n.language);
  const showStatus = effectiveEventStatus(event) !== EventStatus.Approved;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden bg-white shadow-card ring-1 ring-ink-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-raised hover:ring-brand-200 ${
        compact ? "rounded-2xl" : "rounded-2xl sm:rounded-3xl"
      }`}
    >
      <div
        className={`relative overflow-hidden ${
          compact ? "aspect-[16/8]" : "aspect-[16/9] sm:aspect-[16/8]"
        }`}
      >
        <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
          <EventCover title={event.title} imageUrl={event.imageUrl} categoryName={event.categoryName} />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" aria-hidden="true" />

        {parts && (
          <div
            className={`absolute flex flex-col items-center bg-white/95 shadow-card backdrop-blur ${
              compact
                ? "top-2 left-2 min-w-[42px] rounded-xl px-2 py-1"
                : "top-2.5 left-2.5 min-w-[46px] rounded-xl px-2 py-1 sm:top-3 sm:left-3 sm:min-w-[50px] sm:rounded-2xl sm:px-2.5 sm:py-1.5"
            }`}
            aria-hidden="true"
          >
            <span
              className={`font-display leading-none font-extrabold text-brand-700 tabular-nums ${
                compact ? "text-[16px]" : "text-[17px] sm:text-[19px]"
              }`}
            >
              {parts.day}
            </span>
            <span
              className={`mt-0.5 leading-none font-bold tracking-wide text-coral-500 uppercase ${
                compact ? "text-[9px]" : "text-[9px] sm:text-[10px]"
              }`}
            >
              {parts.month}
            </span>
          </div>
        )}
        {showStatus && (
          <div className={compact ? "absolute top-2 right-2" : "absolute top-2.5 right-2.5 sm:top-3 sm:right-3"}>
            <EventStatusBadge status={event.status} isDeleted={event.isDeleted} />
          </div>
        )}
        <span
          className={`absolute max-w-[72%] truncate rounded-full bg-white/20 font-semibold text-white ring-1 ring-white/35 backdrop-blur-md ${
            compact
              ? "bottom-2 left-2 px-2 py-0.5 text-[10px] leading-tight"
              : "bottom-2.5 left-2.5 px-2.5 py-0.5 text-[11px] leading-tight sm:bottom-3 sm:left-3 sm:py-1 sm:text-xs"
          }`}
        >
          {formatCategoryName(event.categoryName, t)}
        </span>
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-3" : "p-3.5 sm:p-4"}`}>
        <h3
          className={`leading-snug font-bold text-ink-900 transition-colors group-hover:text-brand-700 ${
            compact ? "line-clamp-1 text-[14px]" : "line-clamp-2 text-[15px] sm:text-[16px]"
          }`}
        >
          <button
            type="button"
            onClick={() => onViewDetail(event)}
            className={`text-left after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-brand-500 ${
              compact ? "after:rounded-2xl" : "after:rounded-2xl sm:after:rounded-3xl"
            }`}
          >
            {event.title}
          </button>
        </h3>
        <p className={`flex items-center gap-1.5 text-ink-500 ${compact ? "mt-1.5 text-xs" : "mt-2 text-xs sm:text-[13px]"}`}>
          <Clock3 size={compact ? 13 : 14} className="shrink-0 text-brand-500" aria-hidden="true" />
          <span className="truncate">{formatCardDate(event.eventDate, i18n.language)}</span>
        </p>
        <p className={`flex items-center gap-1.5 text-ink-500 ${compact ? "mt-0.5 text-xs" : "mt-1 text-xs sm:text-[13px]"}`}>
          <MapPin size={compact ? 13 : 14} className="shrink-0 text-coral-500" aria-hidden="true" />
          <span className="truncate">{event.location || t("Student_NoLocation")}</span>
        </p>

        <div className={compact ? "mt-auto pt-2.5" : "mt-auto pt-3"}>
          <div
            className={`flex items-center justify-between gap-2 border-t border-ink-100 ${
              compact ? "pt-2" : "pt-2.5 sm:pt-3"
            }`}
          >
            {event.isCreator ? (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] leading-tight font-bold text-brand-700 ring-1 ring-brand-100">
                {t("UI_YourEvent")}
              </span>
            ) : event.isJoined ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] leading-tight font-bold text-emerald-700 ring-1 ring-emerald-200">
                <CircleCheck size={12} aria-hidden="true" />
                {t("UI_Joined")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                {t("Student_ViewDetails")}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            )}
            <button
              type="button"
              onClick={() => (onOpenComments ?? onViewDetail)(event)}
              aria-label={`${t("Event_CommentsButton")}: ${event.title}`}
              title={t("Event_CommentsButton")}
              className={`relative z-10 grid shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-500 ring-1 ring-ink-200/70 transition-colors hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200 ${
                compact ? "size-7 rounded-lg" : "size-8 sm:size-9"
              }`}
            >
              <MessageCircle size={compact ? 14 : 15} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}