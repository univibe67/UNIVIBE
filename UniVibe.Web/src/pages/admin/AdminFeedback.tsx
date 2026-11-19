import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { adminApi } from "../../services/adminApi";
import type { AdminFeedback as AdminFeedbackItem } from "../../services/adminApi";
import { adminStore } from "../../services/adminStore";
import { formatDate } from "../../utils/format";

const GUEST_EMAIL_PATTERN = /^\[Gönderen E-posta:\s*([^\]]+)\]\s*/i;

export default function AdminFeedback() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void adminApi
      .getFeedbacks()
      .then((data) => {
        setItems(data);
        adminStore.setFeedbacks(data);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title={t("Admin_FeedbackTitle")} description={t("Admin_FeedbackDescription")} />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<Inbox size={22} />} title={t("Admin_NoFeedback")} />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const guestEmail = item.message?.match(GUEST_EMAIL_PATTERN)?.[1]?.trim() ?? null;
            const message = item.message?.replace(GUEST_EMAIL_PATTERN, "");
            const hasName = Boolean(item.userFullName?.trim() && item.userFullName !== "Unknown");
            const sender = hasName ? item.userFullName : guestEmail || t("Admin_Unknown");

            return (
              <article key={item.id} className="rounded-3xl bg-white shadow-card ring-1 ring-ink-200/70 p-5 shadow-card">
                <header className="flex items-center gap-3">
                  <Avatar name={sender} className="size-9 text-xs" />
                  <div className="min-w-0 flex-1" translate="no">
                    <p className="truncate text-sm font-semibold text-ink-900">{sender}</p>
                    {hasName && guestEmail && <p className="truncate text-[13px] text-ink-500">{guestEmail}</p>}
                  </div>
                  {guestEmail && !hasName && <Badge tone="brand">{t("Feedback_GuestBadge")}</Badge>}
                  <time dateTime={item.createdAt} className="shrink-0 text-[13px] text-ink-500 tabular-nums">
                    {formatDate(item.createdAt, i18n.language)}
                  </time>
                </header>
                <h2 className="mt-4 text-[15px] font-semibold break-words text-ink-900">
                  {item.subject ?? t("Admin_FeedbackDefaultSubject")}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-600">{message}</p>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
