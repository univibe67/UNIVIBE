import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CalendarPlus, Clock3, History, MapPin, MessageCircle, Plus, Users, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import CancelEventModal from "../../components/events/CancelEventModal";
import EventCard from "../../components/events/EventCard";
import EventChatModal from "../../components/events/EventChatModal";
import EventCover from "../../components/events/EventCover";
import EventDetailModal from "../../components/events/EventDetailModal";
import EventStatusBadge from "../../components/events/EventStatusBadge";
import { EventGrid, EventGridSkeleton } from "../../components/events/EventGrid";
import Button from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/buttonStyles";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import Segmented from "../../components/ui/Segmented";
import { useEventDialogs } from "../../hooks/useEventDialogs";
import { api } from "../../services/api";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { formatCategoryName } from "../../utils/categoryLabel";
import { isEventInFuture } from "../../utils/eventFilter";
import { formatDateTime } from "../../utils/format";

type JoinedTab = "upcoming" | "past";

export default function StudentEvents() {
  const { t, i18n } = useTranslation();
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [tab, setTab] = useState<JoinedTab>("upcoming");

  const fetchData = useCallback(async () => {
    const [activeResult, joinedResult] = await Promise.allSettled([
      api.get("/events/active/me"),
      api.get("/events/joined/me"),
    ]);

    const active = activeResult.status === "fulfilled" ? unwrap<EventItem>(activeResult.value) : null;
    setActiveEvent(active?.id ? active : null);

    const joined = joinedResult.status === "fulfilled" ? unwrap<EventItem[]>(joinedResult.value) : [];
    setJoinedEvents(Array.isArray(joined) ? joined : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const { openDetail, openComments, detailProps, chatProps } = useEventDialogs({
    onChanged: fetchData,
    closeDetailOnLeave: true,
  });

  const { upcoming, past } = useMemo(() => {
    const byDate = [...joinedEvents].sort(
      (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime(),
    );
    return {
      upcoming: byDate.filter((event) => isEventInFuture(event.eventDate)),
      past: byDate.filter((event) => !isEventInFuture(event.eventDate)).reverse(),
    };
  }, [joinedEvents]);

  const visibleJoined = tab === "upcoming" ? upcoming : past;

  return (
    <>
      <PageHeader title={t("UI_MyEvents")} description={t("Student_Events_Desc")} />

      {loading ? (
        <EventGridSkeleton count={3} />
      ) : (
        <div className="space-y-10">
          <section aria-labelledby="active-event-heading">
            <h2 id="active-event-heading" className="mb-5 text-[22px] leading-tight font-bold text-ink-900">
              {t("Student_MyActiveEvent")}
            </h2>
            {activeEvent ? (
              <article className="grid overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
                <div className="relative aspect-[16/10] md:aspect-auto md:min-h-72">
                  <EventCover title={activeEvent.title} imageUrl={activeEvent.imageUrl} categoryName={activeEvent.categoryName} iconSize={36} />
                  <div className="absolute top-4 left-4">
                    <EventStatusBadge status={activeEvent.status} isDeleted={activeEvent.isDeleted} />
                  </div>
                </div>
                <div className="flex flex-col p-6 sm:p-8">
                  <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                    {formatCategoryName(activeEvent.categoryName, t)}
                  </span>
                  <h3 className="mt-3 text-[24px] leading-tight font-extrabold text-ink-900 sm:text-[28px]">{activeEvent.title}</h3>
                  <ul className="mt-4 space-y-2 text-sm text-ink-600">
                    <li className="flex items-center gap-2">
                      <Clock3 size={16} className="shrink-0 text-brand-500" aria-hidden="true" />
                      {formatDateTime(activeEvent.eventDate, i18n.language)}
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin size={16} className="shrink-0 text-coral-500" aria-hidden="true" />
                      <span className="truncate">{activeEvent.location || t("Student_NoLocation")}</span>
                    </li>
                    {typeof activeEvent.participantCount === "number" && (
                      <li className="flex items-center gap-2">
                        <Users size={16} className="shrink-0 text-emerald-500" aria-hidden="true" />
                        {t("UI_ParticipantCount", { count: activeEvent.participantCount })}
                      </li>
                    )}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-2.5 pt-6">
                    <Button onClick={() => void openDetail(activeEvent, { isCreator: true })}>{t("Student_ViewDetails")}</Button>
                    <Button variant="secondary" onClick={() => void openComments(activeEvent, { isCreator: true })}>
                      <MessageCircle size={16} aria-hidden="true" />
                      {t("Event_CommentsButton")}
                    </Button>
                    <Button variant="dangerSoft" className="sm:ml-auto" onClick={() => setCancelId(activeEvent.id)}>
                      <XCircle size={16} aria-hidden="true" />
                      {t("Student_CancelEventBtn")}
                    </Button>
                  </div>
                </div>
              </article>
            ) : (
              <EmptyState
                icon={<CalendarPlus size={22} />}
                title={t("Student_NoActiveEvent")}
                description={t("Student_NewEventDescription")}
                action={
                  <Link to="/student/events/new" className={buttonClass("primary", "md")}>
                    <Plus size={17} aria-hidden="true" />
                    {t("Student_CreateEvent")}
                  </Link>
                }
              />
            )}
          </section>

          <section aria-labelledby="joined-events-heading">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="joined-events-heading" className="text-[22px] leading-tight font-bold text-ink-900">
                {t("Student_JoinedEvents")}
              </h2>
              <Segmented
                ariaLabel={t("Student_JoinedEvents")}
                value={tab}
                onChange={setTab}
                options={[
                  { value: "upcoming", label: t("UI_Upcoming"), count: upcoming.length },
                  { value: "past", label: t("UI_Past"), count: past.length },
                ]}
              />
            </div>
            {visibleJoined.length > 0 ? (
              <EventGrid>
                {visibleJoined.map((event) => (
                  <EventCard
                    key={event.id}
                    event={{ ...event, isJoined: true }}
                    onViewDetail={() => void openDetail(event, { isJoined: true })}
                    onOpenComments={() => void openComments(event, { isJoined: true })}
                  />
                ))}
              </EventGrid>
            ) : tab === "upcoming" ? (
              <EmptyState
                icon={<CalendarCheck size={22} />}
                title={t("Student_NoJoinedEvents")}
                action={
                  <Link to="/student/home" className={buttonClass("secondary", "md")}>
                    {t("Student_Discover")}
                  </Link>
                }
              />
            ) : (
              <EmptyState icon={<History size={22} />} title={t("UI_NoPastEvents")} />
            )}
          </section>
        </div>
      )}

      <EventDetailModal {...detailProps} />
      <EventChatModal {...chatProps} />
      <CancelEventModal
        eventId={cancelId}
        onClose={() => setCancelId(null)}
        onCancelled={() => {
          setCancelId(null);
          void fetchData();
        }}
      />
    </>
  );
}
