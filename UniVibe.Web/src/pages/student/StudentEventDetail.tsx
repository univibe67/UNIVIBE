import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarX2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import CancelEventModal from "../../components/events/CancelEventModal";
import EventActions from "../../components/events/EventActions";
import EventCover from "../../components/events/EventCover";
import EventFacts from "../../components/events/EventFacts";
import EventReasons from "../../components/events/EventReasons";
import EventStatusBadge from "../../components/events/EventStatusBadge";
import EventCommentsChat from "../../components/EventCommentsChat";
import Button from "../../components/ui/Button";
import { buttonClass } from "../../components/ui/buttonStyles";
import EmptyState from "../../components/ui/EmptyState";
import FullPageLoader from "../../components/ui/FullPageLoader";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { EventStatus, effectiveEventStatus } from "../../utils/eventStatus";

export default function StudentEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!id) return;
    try {
      const data = unwrap<EventItem>(await api.get(`/events/${id}`));
      if (data?.id) {
        setEvent(data);
        setError("");
      } else {
        setError(t("UI_EventNotFound"));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  const join = async () => {
    if (!id) return;
    setJoining(true);
    try {
      await api.post(`/events/${id}/attendees`);
      toast.success(t("Student_JoinSuccess"));
      await fetchEvent();
    } catch (err) {
      if ((err as { response?: { status?: number } })?.response?.status === 409) {
        setEvent((current) => (current ? { ...current, isJoined: true } : current));
        toast.success(t("Student_AlreadyJoinedNotice"));
      } else {
        toast.error(getErrorMessage(err) || t("Student_JoinError"));
      }
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!id) return;
    setLeaving(true);
    try {
      await api.delete(`/events/${id}/attendees/me`);
      setEvent((current) => (current ? { ...current, isJoined: false } : current));
      toast.success(t("Student_LeaveSuccess"));
      await fetchEvent();
    } catch (err) {
      toast.error(getErrorMessage(err) || t("Student_LeaveError"));
    } finally {
      setLeaving(false);
    }
  };

  if (loading) return <FullPageLoader label={t("Admin_LoadingDetails")} />;

  if (error || !event) {
    return (
      <EmptyState
        icon={<CalendarX2 size={22} />}
        title={t("UI_EventNotFound")}
        description={error}
        action={
          <Link to="/student/home" className={buttonClass("secondary", "md")}>
            {t("Student_Discover")}
          </Link>
        }
      />
    );
  }

  const status = effectiveEventStatus(event);
  const canCancel = event.isCreator && status !== EventStatus.Cancelled;

  return (
    <>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-ink-600 transition-colors hover:text-ink-900"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t("RegComplete_Back")}
      </button>

      <div className="aspect-[2/1] max-h-80 w-full overflow-hidden rounded-3xl bg-ink-100 sm:aspect-[3/1]">
        <EventCover title={event.title} imageUrl={event.imageUrl} categoryName={event.categoryName} iconSize={64} />
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <header>
            {status !== EventStatus.Approved && (
              <EventStatusBadge status={event.status} isDeleted={event.isDeleted} className="mb-3" />
            )}
            <h1 className="text-[30px] leading-tight font-extrabold text-ink-900 sm:text-[42px]">{event.title}</h1>
          </header>
          <EventReasons event={event} />
          <section className="rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 p-5 shadow-card sm:p-6">
            <EventFacts event={event} />
            <div className="mt-5 border-t border-ink-100 pt-5">
              <h2 className="text-sm font-semibold text-ink-900">{t("Student_EventDescription")}</h2>
              <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-ink-600">
                {event.description || t("Student_NoEventDescription")}
              </p>
            </div>
          </section>
          <section className="rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 p-5 shadow-card sm:p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-ink-900">{t("Event_CommentsTitle")}</h2>
            <EventCommentsChat
              eventId={event.id}
              isJoined={event.isJoined}
              isCreator={event.isCreator}
              creatorId={event.creatorId ?? event.createdById ?? event.organizerId ?? event.userId}
            />
          </section>
        </div>

        <aside className="flex flex-col gap-2.5 rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 p-4 shadow-card empty:hidden lg:sticky lg:top-24">
          <EventActions event={event} joining={joining} leaving={leaving} onJoin={join} onLeave={leave} />
          {canCancel && (
            <Button variant="dangerSoft" onClick={() => setCancelOpen(true)}>
              <XCircle size={16} aria-hidden="true" />
              {t("Student_CancelEventButton")}
            </Button>
          )}
        </aside>
      </div>

      <CancelEventModal
        eventId={cancelOpen ? event.id : null}
        onClose={() => setCancelOpen(false)}
        onCancelled={() => navigate("/student/profile", { replace: true })}
      />
    </>
  );
}
