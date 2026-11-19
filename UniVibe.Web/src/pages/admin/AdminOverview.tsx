import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarClock,
  CalendarRange,
  CircleCheck,
  MessageSquare,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";
import IconTile from "../../components/ui/IconTile";
import VibeWave from "../../components/ui/VibeWave";
import { adminApi } from "../../services/adminApi";
import type { AdminEvent } from "../../services/adminApi";
import { useAdminStore } from "../../services/adminStore";
import { formatCategoryName } from "../../utils/categoryLabel";
import { formatDate } from "../../utils/format";

function StatCard({ label, value, icon, tone, bar }: { label: string; value: number; icon: ReactNode; tone: string; bar: string }) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-4 pb-5 shadow-card ring-1 ring-ink-200/70 sm:p-5 sm:pb-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug font-semibold text-ink-500">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${tone}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-auto pt-3 font-display text-[32px] leading-none font-extrabold sm:text-[40px] text-ink-900 tabular-nums">{value}</p>
      <span className={`absolute inset-x-0 bottom-0 h-1 ${bar}`} aria-hidden="true" />
    </div>
  );
}

function QueueLink({ to, icon, title, text }: { to: string; icon: ReactNode; title: string; text: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-ink-50">
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="mt-0.5 block text-[13px] text-ink-500">{text}</span>
      </span>
      <ArrowRight size={16} className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export default function AdminOverview() {
  const { t, i18n } = useTranslation();
  const { stats, users, feedbacks, error } = useAdminStore();
  const [pending, setPending] = useState<AdminEvent[]>([]);

  useEffect(() => {
    void adminApi.getPendingEvents().then(setPending);
  }, []);

  const pendingCount = stats.pendingEvents ?? 0;
  const suspendedUsers = users.filter((user) => !user.isActive).length;

  return (
    <>
      <section className="relative isolate mb-6 overflow-hidden rounded-3xl px-6 py-8 text-white shadow-raised sm:px-8 sm:py-10">
        <div
          className="absolute inset-0 -z-20"
          style={{ background: "linear-gradient(135deg, #0d1b33 0%, #10284a 55%, #1a2350 100%)" }}
          aria-hidden="true"
        />
        <VibeWave className="absolute inset-0 -z-10 h-full w-full opacity-85 [mask-image:linear-gradient(to_right,transparent_20%,black_65%)] max-sm:opacity-35" />
        <div className="absolute inset-y-0 left-0 -z-10 w-full bg-gradient-to-r from-ink-900 via-ink-900/75 to-transparent sm:w-2/3" aria-hidden="true" />
        <p className="text-[13px] font-semibold text-brand-200">{t("Admin_BrandSubtitle")}</p>
        <h1 className="mt-1.5 text-[30px] leading-tight font-extrabold sm:text-[38px]">{t("Admin_OverviewTitle")}</h1>
        <p className="mt-2 max-w-md text-[15px] leading-relaxed text-white/75">{t("Admin_OverviewDescription")}</p>
      </section>
      {error && <Alert className="mb-5">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard tone="bg-brand-50 text-brand-600" bar="bg-brand-500" label={t("Admin_TotalUsers")} value={users.length} icon={<Users size={19} />} />
        <StatCard tone="bg-violet-50 text-violet-600" bar="bg-violet-500" label={t("Admin_TotalEvents")} value={stats.totalCreatedEvents} icon={<CalendarRange size={19} />} />
        <StatCard tone="bg-emerald-50 text-emerald-600" bar="bg-emerald-500" label={t("Admin_ActiveEvents")} value={stats.activeEvents} icon={<CalendarCheck2 size={19} />} />
        <StatCard tone="bg-coral-50 text-coral-600" bar="bg-coral-500" label={t("Admin_PendingEvents")} value={pendingCount} icon={<CalendarClock size={19} />} />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
          <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
            <h2 className="text-lg leading-tight font-bold text-ink-900">{t("Admin_PendingEvents")}</h2>
            <Link to="/admin/events" className="rounded text-[13px] font-semibold text-brand-700 hover:underline">
              {t("Student_ViewAll")}
            </Link>
          </div>
          {pending.length > 0 ? (
            <ul className="divide-y divide-ink-100">
              {pending.slice(0, 5).map((event) => (
                <li key={event.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{event.title}</p>
                    <p className="mt-0.5 truncate text-[13px] text-ink-500">
                      {event.organizerName ?? event.creatorName ?? t("Admin_Unknown")} ·{" "}
                      {formatCategoryName(event.categoryName, t)}
                    </p>
                  </div>
                  <time dateTime={event.eventDate} className="shrink-0 text-[13px] text-ink-500 tabular-nums">
                    {formatDate(event.eventDate, i18n.language)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              className="m-4 border-none"
              icon={<CircleCheck size={22} />}
              title={t("Admin_Summary_NoPendingEvents")}
              description={t("Admin_Summary_EventsUpToDate")}
            />
          )}
        </section>

        <section className="overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
          <h2 className="border-b border-ink-100 px-5 py-4 text-lg leading-tight font-bold text-ink-900">
            {t("Admin_OverviewSummaryTitle")}
          </h2>
          <div className="divide-y divide-ink-100">
            <QueueLink
              to="/admin/events"
              icon={
                <IconTile tone={pendingCount > 0 ? "warning" : "success"}>
                  {pendingCount > 0 ? <ShieldAlert size={19} /> : <CircleCheck size={19} />}
                </IconTile>
              }
              title={t("Admin_Summary_EventsHeading")}
              text={
                pendingCount > 0
                  ? t("Admin_Summary_PendingEvents", { count: pendingCount })
                  : t("Admin_Summary_NoPendingEvents")
              }
            />
            <QueueLink
              to="/admin/feedback"
              icon={<IconTile><MessageSquare size={19} /></IconTile>}
              title={t("Admin_Summary_FeedbackHeading")}
              text={
                feedbacks.length > 0
                  ? t("Admin_Summary_TotalFeedback", { count: feedbacks.length })
                  : t("Admin_Summary_NoFeedbackYet")
              }
            />
            <QueueLink
              to="/admin/users"
              icon={<IconTile><Users size={19} /></IconTile>}
              title={t("Admin_Summary_UsersHeading")}
              text={
                suspendedUsers > 0
                  ? t("Admin_Summary_SuspendedWarning", { count: suspendedUsers })
                  : t("Admin_Summary_AllUsersActive")
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}
