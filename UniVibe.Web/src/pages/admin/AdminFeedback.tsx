import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Inbox } from "lucide-react";
import { useTranslation } from "react-i18next";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import Skeleton from "../../components/ui/Skeleton";
import { adminApi } from "../../services/adminApi";
import type { AdminFeedback as AdminFeedbackItem } from "../../services/adminApi";
import { adminStore } from "../../services/adminStore";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { formatDate } from "../../utils/format";

const GUEST_EMAIL_PATTERN = /^\[Gönderen E-posta:\s*([^\]]+)\]\s*/i;

function parseFeedback(item: AdminFeedbackItem) {
  const guestEmail = item.message?.match(GUEST_EMAIL_PATTERN)?.[1]?.trim() ?? null;
  const message = item.message?.replace(GUEST_EMAIL_PATTERN, "") ?? "";
  const hasName = Boolean(item.userFullName?.trim() && item.userFullName !== "Unknown");
  const sender = hasName ? item.userFullName : guestEmail || tFallback(item);
  return { guestEmail, message, hasName, sender };
}

function tFallback(item: AdminFeedbackItem) {
  return item.userFullName || "Unknown";
}

export default function AdminFeedback() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const loadFeedbacks = useCallback(async () => {
    try {
      const data = await adminApi.getFeedbacks();
      setItems(data);
      adminStore.setFeedbacks(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFeedbacks();
  }, [loadFeedbacks]);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      await api.patch(`/feedbacks/${id}/resolution`);
      const updated = items.map((item) => (item.id === id ? { ...item, isResolved: true } : item));
      setItems(updated);
      adminStore.setFeedbacks(updated);
      toast.success(t("Admin_FeedbackResolvedSuccess", { defaultValue: "Geri bildirim tamamlandı olarak işaretlendi." }));
    } catch (error) {
      toast.error(getErrorMessage(error) || t("Admin_FeedbackResolveError", { defaultValue: "İşlem tamamlanamadı." }));
    } finally {
      setResolvingId(null);
    }
  };

  const selected = items.find((item) => item.id === selectedId) ?? null;
  const selectedParsed = selected ? parseFeedback(selected) : null;

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
            const { guestEmail, message, hasName, sender } = parseFeedback(item);
            const displaySender = sender === "Unknown" ? t("Admin_Unknown") : sender;

            return (
              <article
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className="cursor-pointer rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink-200/70 transition hover:ring-brand-300"
              >
                <header className="flex items-center gap-3">
                  <Avatar name={displaySender} className="size-9 text-xs" />
                  <div className="min-w-0 flex-1" translate="no">
                    <p className="truncate text-sm font-semibold text-ink-900">{displaySender}</p>
                    {hasName && guestEmail && <p className="truncate text-[13px] text-ink-500">{guestEmail}</p>}
                  </div>
                  {item.isResolved && <Badge tone="success">{t("Admin_ResolvedBadge", { defaultValue: "Tamamlandı" })}</Badge>}
                  {guestEmail && !hasName && <Badge tone="brand">{t("Feedback_GuestBadge")}</Badge>}
                  <time dateTime={item.createdAt} className="shrink-0 text-[13px] text-ink-500 tabular-nums">
                    {formatDate(item.createdAt, i18n.language)}
                  </time>
                </header>
                <h2 className="mt-4 text-[15px] font-semibold break-words text-ink-900">
                  {item.subject ?? t("Admin_FeedbackDefaultSubject")}
                </h2>
                <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-600">{message}</p>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={Boolean(selected && selectedParsed)}
        onClose={() => setSelectedId(null)}
        size="lg"
        ariaLabel={selected?.subject ?? t("Admin_FeedbackDefaultSubject")}
        footer={
          selected && (
            <>
              <Button type="button" variant="secondary" onClick={() => setSelectedId(null)}>
                {t("UI_Close", { defaultValue: "Kapat" })}
              </Button>
              {!selected.isResolved && (
                <Button type="button" loading={resolvingId === selected.id} onClick={() => void handleResolve(selected.id)}>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  {t("Admin_MarkResolved", { defaultValue: "Tamamlandı Olarak İşaretle" })}
                </Button>
              )}
            </>
          )
        }
      >
        {selected && selectedParsed && (
          <div className="space-y-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar
                name={selectedParsed.sender === "Unknown" ? t("Admin_Unknown") : selectedParsed.sender}
                className="size-10 text-sm"
              />
              <div className="min-w-0 flex-1" translate="no">
                <p className="truncate text-sm font-bold text-ink-900">
                  {selectedParsed.sender === "Unknown" ? t("Admin_Unknown") : selectedParsed.sender}
                </p>
                {selectedParsed.hasName && selectedParsed.guestEmail && (
                  <p className="truncate text-xs text-ink-500">{selectedParsed.guestEmail}</p>
                )}
              </div>
              {selected.isResolved && <Badge tone="success">{t("Admin_ResolvedBadge", { defaultValue: "Tamamlandı" })}</Badge>}
              <time dateTime={selected.createdAt} className="text-xs text-ink-500 tabular-nums">
                {formatDate(selected.createdAt, i18n.language)}
              </time>
            </div>
            <div className="border-t border-ink-100 pt-4">
              <h3 className="text-lg font-extrabold text-ink-900">
                {selected.subject ?? t("Admin_FeedbackDefaultSubject")}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed break-words whitespace-pre-wrap text-ink-700">
                {selectedParsed.message}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}