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
import IconTile from "../../components/ui/IconTile";
import PageHeader from "../../components/ui/PageHeader";
import { useAdminStore } from "../../services/adminStore";

function StatCard({
  label,
  value,
  icon,
  tone,
  bar,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: string;
  bar: string;
}) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-4 pb-5 shadow-card ring-1 ring-ink-200/70 sm:p-5 sm:pb-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-snug font-semibold text-ink-500">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-xl sm:size-10 ${tone}`} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="mt-auto pt-3 font-display text-[32px] leading-none font-extrabold text-ink-900 tabular-nums sm:text-[40px]">
        {value}
      </p>
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
      <ArrowRight
        size={16}
        className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

export default function AdminOverview() {
  const { t } = useTranslation();
  const { stats, users, feedbacks, error } = useAdminStore();

  const pendingCount = stats.pendingEvents ?? 0;
  const suspendedUsers = users.filter((user) => !user.isActive).length;

  return (
    <>
      <PageHeader title={t("Admin_OverviewTitle")} description={t("Admin_OverviewDescription")} />
      {error && <Alert className="mb-5">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          tone="bg-brand-50 text-brand-600"
          bar="bg-brand-500"
          label={t("Admin_TotalUsers")}
          value={users.length}
          icon={<Users size={19} />}
        />
        <StatCard
          tone="bg-violet-50 text-violet-600"
          bar="bg-violet-500"
          label={t("Admin_TotalEvents")}
          value={stats.totalCreatedEvents}
          icon={<CalendarRange size={19} />}
        />
        <StatCard
          tone="bg-emerald-50 text-emerald-600"
          bar="bg-emerald-500"
          label={t("Admin_ActiveEvents")}
          value={stats.activeEvents}
          icon={<CalendarCheck2 size={19} />}
        />
        <StatCard
          tone="bg-coral-50 text-coral-600"
          bar="bg-coral-500"
          label={t("Admin_PendingEvents")}
          value={pendingCount}
          icon={<CalendarClock size={19} />}
        />
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70">
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
            icon={
              <IconTile>
                <MessageSquare size={19} />
              </IconTile>
            }
            title={t("Admin_Summary_FeedbackHeading")}
            text={
              feedbacks.length > 0
                ? t("Admin_Summary_TotalFeedback", { count: feedbacks.length })
                : t("Admin_Summary_NoFeedbackYet")
            }
          />
          <QueueLink
            to="/admin/users"
            icon={
              <IconTile>
                <Users size={19} />
              </IconTile>
            }
            title={t("Admin_Summary_UsersHeading")}
            text={
              suspendedUsers > 0
                ? t("Admin_Summary_SuspendedWarning", { count: suspendedUsers })
                : t("Admin_Summary_AllUsersActive")
            }
          />
        </div>
      </section>
    </>
  );
}