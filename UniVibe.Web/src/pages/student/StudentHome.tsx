import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, CalendarSearch, ChevronRight, Clock3, Compass, MapPin, Plus, RefreshCw, SearchX } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CategoryChips from "../../components/events/CategoryChips";
import EventCard from "../../components/events/EventCard";
import EventChatModal from "../../components/events/EventChatModal";
import EventCover from "../../components/events/EventCover";
import EventDetailModal from "../../components/events/EventDetailModal";
import { EventGrid, EventGridSkeleton } from "../../components/events/EventGrid";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { SearchInput } from "../../components/ui/Field";
import VibeWave from "../../components/ui/VibeWave";
import { useEventDialogs } from "../../hooks/useEventDialogs";
import { api } from "../../services/api";
import { useCurrentUser } from "../../services/currentUser";
import { getErrorMessage } from "../../services/errorMessage";
import { unwrap } from "../../services/unwrap";
import type { EventItem } from "../../types/event";
import { CATEGORY_KEYS, formatCategoryName, getCategoryKey } from "../../utils/categoryLabel";
import { categoryVisual } from "../../utils/categoryVisual";
import type { CategoryKey } from "../../utils/categoryLabel";
import { isEventActiveAndJoinable } from "../../utils/eventFilter";
import { dateParts, formatCardDate, formatDateTime } from "../../utils/format";

interface PaginatedEvents {
  items?: EventItem[];
  Items?: EventItem[];
}

const normalize = (value?: string) => (value ?? "").toLocaleLowerCase("tr-TR");

export default function StudentHome() {
  const { t, i18n } = useTranslation();
  const user = useCurrentUser();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryKey | "">("");

  const fetchEvents = useCallback(async () => {
    try {
      const result = unwrap<PaginatedEvents>(
        await api.get("/events", { params: { PageNumber: 1, PageSize: 50, OnlyActive: true } }),
      );
      setEvents(result?.items ?? result?.Items ?? []);
      setLoadError("");
    } catch (error) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const { openDetail, openComments, detailProps, chatProps } = useEventDialogs({ onChanged: fetchEvents });

  const activeEvents = useMemo(
    () =>
      events
        .filter(isEventActiveAndJoinable)
        .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    [events],
  );

  const filteredEvents = useMemo(() => {
    const term = normalize(search.trim());
    return activeEvents.filter((event) => {
      const matchesSearch =
        !term ||
        normalize(event.title).includes(term) ||
        normalize(event.creatorName ?? event.organizerName).includes(term);
      return matchesSearch && (!category || getCategoryKey(event.categoryName) === category);
    });
  }, [activeEvents, search, category]);

  const [featured, ...upcoming] = activeEvents;
  const hasFilters = Boolean(search.trim() || category);
  const joinedCount = activeEvents.filter((event) => event.isJoined).length;

  return (
    <>
      <section className="relative isolate overflow-hidden rounded-[32px] bg-ink-900 px-6 py-10 text-white shadow-raised sm:px-10 sm:py-14 lg:px-14">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "radial-gradient(80% 90% at 0% 0%, #1b3a6b 0%, transparent 60%), linear-gradient(135deg, #0d1b33 0%, #10284a 55%, #1a2350 100%)" }}
          aria-hidden="true"
        />
        <VibeWave className="absolute inset-0 -z-10 h-full w-full opacity-95 [mask-image:linear-gradient(to_right,transparent_15%,black_60%)] max-sm:opacity-40" />
        <div className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-ink-900 via-ink-900/80 to-transparent sm:w-2/3" aria-hidden="true" />

        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[13px] font-semibold text-white/90 ring-1 ring-white/15 backdrop-blur">
            <span className="size-2 rounded-full bg-vibe shadow-[0_0_0_4px_rgb(16_185_129/0.25)]" aria-hidden="true" />
            {t("Student_Greeting")} {user?.firstName ?? ""}
          </p>
          <h1 className="mt-5 text-[40px] leading-[1.05] font-extrabold sm:text-[56px]">{t("Student_HeroTitle")}</h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75 sm:text-base">{t("UI_HeroSubtitle")}</p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#events-heading"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-5 text-[15px] font-bold text-brand-800 shadow-raised transition hover:bg-brand-50"
            >
              <Compass size={18} aria-hidden="true" />
              {t("UI_BrowseEvents")}
            </a>
            <Link
              to="/student/events/new"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-white/10 px-5 text-[15px] font-bold text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-white/20"
            >
              <Plus size={18} aria-hidden="true" />
              {t("Student_CreateEvent")}
            </Link>
          </div>

          <dl className="mt-10 flex gap-8">
            <div>
              <dt className="text-[13px] text-white/60">{t("UI_ActiveEventsStat")}</dt>
              <dd className="font-display text-[32px] leading-tight font-extrabold tabular-nums">{loading ? "–" : activeEvents.length}</dd>
            </div>
            <div className="border-l border-white/15 pl-8">
              <dt className="text-[13px] text-white/60">{t("UI_CategoriesStat")}</dt>
              <dd className="font-display text-[32px] leading-tight font-extrabold tabular-nums">{CATEGORY_KEYS.length}</dd>
            </div>
            <div className="border-l border-white/15 pl-8 max-sm:hidden">
              <dt className="text-[13px] text-white/60">{t("UI_JoinedStat")}</dt>
              <dd className="font-display text-[32px] leading-tight font-extrabold text-vibe tabular-nums">{loading ? "–" : joinedCount}</dd>
            </div>
          </dl>
        </div>
      </section>

      {featured && (
        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]" aria-label={t("UI_NextUp")}>
          <button
            type="button"
            onClick={() => void openDetail(featured)}
            className="group relative isolate flex min-h-[340px] flex-col justify-end overflow-hidden rounded-3xl p-6 text-left text-white shadow-card ring-1 ring-ink-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-raised sm:min-h-[400px] sm:p-8"
          >
            <span className="absolute inset-0 -z-20 transition-transform duration-700 group-hover:scale-105">
              <EventCover title={featured.title} imageUrl={featured.imageUrl} categoryName={featured.categoryName} iconSize={40} />
            </span>
            <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink-900/90 via-ink-900/40 via-45% to-transparent to-75%" aria-hidden="true" />
            <span className="absolute top-5 left-5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] leading-none font-bold text-coral-600 shadow-card">
              <span className="size-1.5 animate-pulse rounded-full bg-coral-500" aria-hidden="true" />
              {t("UI_NextUp")}
            </span>
            <span className="absolute top-5 right-5 grid size-11 place-items-center rounded-xl bg-white/20 text-white ring-1 ring-white/35 backdrop-blur-md transition group-hover:bg-white group-hover:text-brand-700" aria-hidden="true">
              <ArrowUpRight size={20} />
            </span>
            <span className="text-[13px] font-semibold text-white/80">{formatCategoryName(featured.categoryName, t)}</span>
            <span className="mt-1.5 block max-w-xl font-display text-[30px] leading-[1.1] font-extrabold sm:text-[40px]">{featured.title}</span>
            <span className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-white/90">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={15} className="shrink-0" aria-hidden="true" />
                {formatDateTime(featured.eventDate, i18n.language)}
              </span>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin size={15} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{featured.location || t("Student_NoLocation")}</span>
              </span>
            </span>
          </button>

          <div className="flex flex-col rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink-200/70">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900">{t("UI_Upcoming")}</h2>
              <CalendarDays size={18} className="text-brand-500" aria-hidden="true" />
            </div>
            {upcoming.length > 0 ? (
              <ul className="mt-3 flex-1 space-y-1">
                {upcoming.slice(0, 4).map((event) => {
                  const parts = dateParts(event.eventDate, i18n.language);
                  const { from, to } = categoryVisual(event.categoryName);
                  return (
                    <li key={event.id}>
                      <button
                        type="button"
                        onClick={() => void openDetail(event)}
                        className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3.5 rounded-2xl p-2 text-left transition-colors hover:bg-ink-50"
                      >
                        <span
                          className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl text-white shadow-card"
                          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                        >
                          <span className="font-display text-[20px] leading-none font-extrabold tabular-nums">{parts?.day}</span>
                          <span className="mt-0.5 text-[10px] leading-none font-bold uppercase opacity-90">{parts?.month}</span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-1 text-[15px] font-semibold text-ink-900 transition-colors group-hover:text-brand-700">{event.title}</span>
                          <span className="mt-0.5 block truncate text-[13px] text-ink-500">
                            {formatCategoryName(event.categoryName, t)} · {formatCardDate(event.eventDate, i18n.language)}
                          </span>
                        </span>
                        <ChevronRight size={16} className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink-500">{t("UI_NoEventsHint")}</p>
            )}
          </div>
        </section>
      )}

      <section className="mt-14 sm:mt-16" aria-labelledby="events-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="events-heading" className="scroll-mt-24 text-[26px] leading-tight font-extrabold text-ink-900 sm:text-[32px]">
            {t("Student_ForYou")}
            {!loading && <span className="ml-2.5 inline-grid h-7 min-w-7 place-items-center rounded-full bg-brand-50 px-2 align-middle text-sm font-bold text-brand-700 ring-1 ring-brand-100 tabular-nums">{filteredEvents.length}</span>}
          </h2>
          <SearchInput
            className="sm:w-80"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("Student_SearchPlaceholder")}
            aria-label={t("Student_SearchPlaceholder")}
          />
        </div>

        <CategoryChips value={category} onChange={setCategory} className="mt-5 mb-6" />

        {loading ? (
          <EventGridSkeleton />
        ) : loadError ? (
          <EmptyState
            icon={<RefreshCw size={22} />}
            title={t("UI_EventsLoadError")}
            description={loadError}
            action={
              <Button variant="secondary" onClick={() => void fetchEvents()}>
                {t("UI_TryAgain")}
              </Button>
            }
          />
        ) : filteredEvents.length > 0 ? (
          <EventGrid>
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetail={() => void openDetail(event)}
                onOpenComments={() => void openComments(event)}
              />
            ))}
          </EventGrid>
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
