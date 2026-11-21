import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  CalendarSearch,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import CategoryChips from "../../components/events/CategoryChips";
import EventChatModal from "../../components/events/EventChatModal";
import EventCover from "../../components/events/EventCover";
import EventDetailModal from "../../components/events/EventDetailModal";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SearchInput } from "../../components/ui/Field";
import Skeleton from "../../components/ui/Skeleton";
import { useEventDialogs } from "../../hooks/useEventDialogs";
import { api } from "../../services/api";
import { useCurrentUser } from "../../services/currentUser";
import { getErrorMessage } from "../../services/errorMessage";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { formatCategoryName, getCategoryKey } from "../../utils/categoryLabel";
import type { CategoryKey } from "../../utils/categoryLabel";
import { isEventActiveAndJoinable } from "../../utils/eventFilter";
import { EventStatus, effectiveEventStatus } from "../../utils/eventStatus";
import { formatCardDate } from "../../utils/format";

interface PaginatedEvents {
  items?: EventItem[];
  Items?: EventItem[];
  totalCount?: number;
  TotalCount?: number;
}

type DateFilter = "all" | "today" | "week";

const PAGE_SIZE = 12;
const normalize = (value?: string) => (value ?? "").toLocaleLowerCase("tr-TR");

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function StudentHome() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [myEvent, setMyEvent] = useState<EventItem | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const fetchMyEvent = useCallback(async () => {
    try {
      const response = await api.get("/events/active/me");
      const created = unwrap<EventItem>(response);

      if (!created?.id) {
        setMyEvent(null);
        return;
      }

      const status = effectiveEventStatus(created);
      const isApproved = status === EventStatus.Approved;
      const isJoinable = isEventActiveAndJoinable(created);

      setMyEvent(isApproved && isJoinable ? { ...created, isCreator: true } : null);
    } catch {
      setMyEvent(null);
    }
  }, []);

  const fetchEvents = useCallback(
    async (targetPage = pageNumber, term = search.trim()) => {
      setLoading(true);
      try {
        const result = unwrap<PaginatedEvents>(
          await api.get("/events", {
            params: {
              PageNumber: targetPage,
              PageSize: PAGE_SIZE,
              OnlyActive: true,
              SearchTerm: term || undefined,
            },
          }),
        );
        const list = result?.items ?? result?.Items ?? [];
        const total = result?.totalCount ?? result?.TotalCount ?? list.length;
        setEvents(list);
        setTotalCount(total);
        setLoadError("");
      } catch (error) {
        setLoadError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    [pageNumber, search],
  );

  const refreshAll = useCallback(() => {
    void Promise.all([fetchEvents(pageNumber, search.trim()), fetchMyEvent()]);
  }, [fetchEvents, fetchMyEvent, pageNumber, search]);

  useEffect(() => {
    void fetchMyEvent();
  }, [fetchMyEvent]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEvents(pageNumber, search.trim());
    }, 200);
    return () => window.clearTimeout(timer);
  }, [fetchEvents, pageNumber, search]);

  useEffect(() => {
    setPageNumber(1);
  }, [search, category, dateFilter]);

  const { openDetail, openComments, detailProps, chatProps } = useEventDialogs({
    onChanged: refreshAll,
  });

  const activeEvents = useMemo(
    () =>
      events
        .filter(isEventActiveAndJoinable)
        .filter((event) => !myEvent?.id || event.id !== myEvent.id)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    [events, myEvent?.id],
  );

  const filteredEvents = useMemo(() => {
    const term = normalize(search.trim());
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    return activeEvents.filter((event) => {
      const matchesSearch =
        !term ||
        normalize(event.title).includes(term) ||
        normalize(event.description).includes(term) ||
        normalize(event.location).includes(term) ||
        normalize(event.creatorName ?? event.organizerName).includes(term);

      if (!matchesSearch) return false;
      if (category && getCategoryKey(event.categoryName) !== category) return false;

      if (dateFilter !== "all") {
        const eventDate = new Date(event.eventDate);
        if (dateFilter === "today" && !isSameDay(eventDate, now)) return false;
        if (dateFilter === "week" && (eventDate < now || eventDate > weekEnd)) return false;
      }

      return true;
    });
  }, [activeEvents, search, category, dateFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const hasFilters = Boolean(search.trim() || category || dateFilter !== "all");

  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <p className="inline-flex max-w-full items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-800 shadow-card ring-1 ring-ink-200/70 sm:px-3.5 sm:py-1.5 sm:text-[13px]">
          <span className="size-2 shrink-0 rounded-full bg-vibe shadow-[0_0_0_4px_rgb(16_185_129/0.2)]" aria-hidden="true" />
          <span className="break-words">
            {t("Student_Greeting")} {user?.firstName ?? ""}
          </span>
        </p>
      </div>

      {myEvent && (
        <section className="mb-8" aria-labelledby="my-event-heading">
          <div className="mb-3 flex items-center gap-2">
            <CalendarPlus size={18} className="text-brand-600" aria-hidden="true" />
            <h2 id="my-event-heading" className="text-lg font-extrabold text-ink-900 sm:text-xl">
              {t("Student_CreatedEvents")}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            <article
              onClick={() => void openDetail(myEvent, { isCreator: true })}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-2.5 shadow-card ring-1 ring-brand-200/80 transition hover:-translate-y-0.5 hover:ring-brand-400"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:size-20">
                <EventCover
                  title={myEvent.title}
                  imageUrl={myEvent.imageUrl}
                  categoryName={myEvent.categoryName}
                  iconSize={24}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[11px] font-semibold text-brand-700">
                    {formatCategoryName(myEvent.categoryName, t)}
                  </span>
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    {t("Student_CreatedEvents")}
                  </span>
                </div>

                <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-700">
                  {myEvent.title}
                </h3>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 size={12} className="shrink-0" aria-hidden="true" />
                    {formatCardDate(myEvent.eventDate, i18n.language)}
                  </span>
                  {myEvent.location && (
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <MapPin size={12} className="shrink-0" aria-hidden="true" />
                      <span className="truncate">{myEvent.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void openComments(myEvent, { isCreator: true });
                }}
                aria-label={t("Event_CommentsButton")}
                title={t("Event_CommentsButton")}
                className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700"
              >
                <MessageCircle size={17} aria-hidden="true" />
              </button>
            </article>
          </div>
        </section>
      )}

      <section aria-labelledby="events-heading">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="events-heading" className="scroll-mt-24 text-[22px] leading-tight font-extrabold text-ink-900 sm:text-[26px]">
            {t("Student_ForYou")}
            {!loading && (
              <span className="ml-2 inline-grid h-6 min-w-6 place-items-center rounded-full bg-brand-50 px-2 align-middle text-xs font-bold text-brand-700 ring-1 ring-brand-100 tabular-nums">
                {hasFilters ? filteredEvents.length : totalCount}
              </span>
            )}
          </h2>
          <SearchInput
            className="sm:w-72"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Student_SearchPlaceholder")}
            aria-label={t("Student_SearchPlaceholder")}
          />
        </div>

        <div className="mt-3.5 mb-4 flex flex-wrap items-center justify-between gap-2.5">
          <CategoryChips value={category} onChange={setCategory} />

          <div className="inline-flex rounded-xl bg-white p-1 shadow-card ring-1 ring-ink-200/70">
            {(
              [
                { id: "all", label: t("UI_All", { defaultValue: "Tümü" }) },
                { id: "today", label: t("UI_Today", { defaultValue: "Bugün" }) },
                { id: "week", label: t("UI_ThisWeek", { defaultValue: "Bu Hafta" }) },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                  dateFilter === tab.id ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : loadError ? (
          <EmptyState
            icon={<RefreshCw size={22} />}
            title={t("UI_EventsLoadError")}
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => void fetchEvents(pageNumber, search.trim())}>
                {t("UI_TryAgain")}
              </Button>
            }
          />
        ) : filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
              {filteredEvents.map((event) => (
                <article
                  key={event.id}
                  onClick={() => void openDetail(event)}
                  className="group flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-2.5 shadow-card ring-1 ring-ink-200/70 transition hover:-translate-y-0.5 hover:ring-brand-300"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink-100 sm:size-20">
                    <EventCover
                      title={event.title}
                      imageUrl={event.imageUrl}
                      categoryName={event.categoryName}
                      iconSize={24}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[11px] font-semibold text-brand-700">
                        {formatCategoryName(event.categoryName, t)}
                      </span>
                      {event.isJoined && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          {t("Student_JoinedBadge", { defaultValue: "Katıldın" })}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-0.5 line-clamp-1 text-sm font-bold text-ink-900 transition-colors group-hover:text-brand-700">
                      {event.title}
                    </h3>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={12} className="shrink-0" aria-hidden="true" />
                        {formatCardDate(event.eventDate, i18n.language)}
                      </span>
                      {event.location && (
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <MapPin size={12} className="shrink-0" aria-hidden="true" />
                          <span className="truncate">{event.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void openComments(event);
                    }}
                    aria-label={t("Event_CommentsButton")}
                    title={t("Event_CommentsButton")}
                    className="grid size-9 shrink-0 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-ink-100 hover:text-brand-700"
                  >
                    <MessageCircle size={17} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((prev) => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  {t("UI_Previous", { defaultValue: "Önceki" })}
                </Button>
                <span className="text-xs font-semibold text-ink-600 tabular-nums">
                  {pageNumber} / {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((prev) => Math.min(totalPages, prev + 1))}
                >
                  {t("UI_Next", { defaultValue: "Sonraki" })}
                  <ChevronRight size={16} aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        ) : hasFilters ? (
          <EmptyState
            icon={<SearchX size={22} />}
            title={t("UI_NoResults")}
            description={t("UI_NoResultsHint")}
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("");
                  setDateFilter("all");
                }}
              >
                {t("UI_ClearFilters")}
              </Button>
            }
          />
        ) : (
          <EmptyState icon={<CalendarSearch size={22} />} title={t("Student_NoEvents")} description={t("UI_NoEventsHint")} />
        )}
      </section>

      <EventDetailModal {...detailProps} />
      <EventChatModal {...chatProps} />
    </>
  );
}