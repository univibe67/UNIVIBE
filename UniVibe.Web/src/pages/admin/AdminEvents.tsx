import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarSearch, Check, Eye, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import DataPanel from "../../components/admin/DataPanel";
import TableSkeleton from "../../components/admin/TableSkeleton";
import { tableCellClass, tableHeadClass } from "../../components/admin/tableStyles";
import EventCover from "../../components/events/EventCover";
import EventFacts from "../../components/events/EventFacts";
import EventReasons from "../../components/events/EventReasons";
import EventStatusBadge from "../../components/events/EventStatusBadge";
import Alert from "../../components/ui/Alert";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { Field, SearchInput, Textarea } from "../../components/ui/Field";
import IconTile from "../../components/ui/IconTile";
import Modal from "../../components/ui/Modal";
import PageHeader from "../../components/ui/PageHeader";
import Pagination from "../../components/ui/Pagination";
import Segmented from "../../components/ui/Segmented";
import { adminApi } from "../../services/adminApi";
import type { AdminEvent } from "../../services/adminApi";
import { adminStore } from "../../services/adminStore";
import { getErrorMessage } from "../../services/errorMessage";
import { toast } from "../../services/toast";
import { formatCategoryName } from "../../utils/categoryLabel";
import {
  EventStatus,
  approveHintKey,
  canApproveEvent,
  canRejectEvent,
  effectiveEventStatus,
  isEventPast,
  rejectHintKey,
} from "../../utils/eventStatus";
import { formatDate } from "../../utils/format";

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "cancelled";

const PAGE_SIZE = 10;
const FILTER_STATUS: Record<Exclude<StatusFilter, "all">, number> = {
  pending: EventStatus.Pending,
  approved: EventStatus.Approved,
  rejected: EventStatus.Rejected,
  cancelled: EventStatus.Cancelled,
};

export default function AdminEvents() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const [now] = useState(() => Date.now());
  const [busyId, setBusyId] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminEvent | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [all, pending] = await Promise.all([adminApi.getEvents(), adminApi.getPendingEvents()]);
      const combined: AdminEvent[] = [
        ...pending,
        ...all.filter((event: AdminEvent) => !pending.some((item: AdminEvent) => item.id === event.id)),
      ];
      setEvents(combined);
      adminStore.setEvents(combined);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<number, number> = {};
    for (const event of events) {
      const status = effectiveEventStatus(event);
      result[status] = (result[status] ?? 0) + 1;
    }
    return result;
  }, [events]);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("tr-TR");
    return events.filter((event) => {
      const matchesFilter = filter === "all" || effectiveEventStatus(event) === FILTER_STATUS[filter];
      const haystack = `${event.title} ${event.organizerName ?? ""}`.toLocaleLowerCase("tr-TR");
      return matchesFilter && (!term || haystack.includes(term));
    });
  }, [events, filter, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const applyLocal = (eventId: string, changes: Partial<AdminEvent>) => {
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, ...changes } : event)));
    setSelected((current) => (current?.id === eventId ? { ...current, ...changes } : current));
  };

  const approve = async (eventId: string) => {
    setBusyId(eventId);
    try {
      await adminApi.approveEvent(eventId);
      adminStore.approveEvent(eventId);
      applyLocal(eventId, { status: EventStatus.Approved });
      toast.success(t("UI_EventApproved"));
      void load();
    } catch (error) {
      toast.error(getErrorMessage(error) || t("Admin_Error_Approve"));
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (eventId: string) => {
    setRejectId(eventId);
    setRejectReason("");
    setRejectError("");
  };

  const confirmReject = async (formEvent: React.FormEvent) => {
    formEvent.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError(t("Admin_Reason_Required"));
      return;
    }
    if (!rejectId) return;

    setRejecting(true);
    setRejectError("");
    try {
      await adminApi.rejectEvent(rejectId, reason);
      adminStore.rejectEvent(rejectId, reason);
      applyLocal(rejectId, { status: EventStatus.Rejected, rejectionReason: reason });
      setRejectId(null);
      toast.success(t("UI_EventRejected"));
      void load();
    } catch (error) {
      setRejectError(getErrorMessage(error) || t("Admin_Error_Reject"));
    } finally {
      setRejecting(false);
    }
  };

  const viewDetails = async (event: AdminEvent) => {
    setSelected(event);
    setDetailLoading(true);
    try {
      const detail = await adminApi.getEvent(event.id);
      setSelected((current) =>
        current?.id === event.id
          ? {
              ...current,
              ...detail,
              status: detail.status ?? event.status,
              organizerName: detail.organizerName ?? detail.creatorName ?? current.organizerName,
            }
          : current,
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  };

  const actionButtons = (event: AdminEvent) => (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        variant="ghost"
        size="iconSm"
        onClick={() => void viewDetails(event)}
        aria-label={`${t("Admin_ViewDetails")}: ${event.title}`}
        title={t("Admin_ViewDetails")}
      >
        <Eye size={17} />
      </Button>
      <Button
        variant="successSoft"
        size="iconSm"
        disabled={!canApproveEvent(event, now)}
        loading={busyId === event.id}
        onClick={() => void approve(event.id)}
        aria-label={`${t("Admin_Approve")}: ${event.title}`}
        title={t(approveHintKey(event, now))}
      >
        {busyId !== event.id && <Check size={17} />}
      </Button>
      <Button
        variant="dangerSoft"
        size="iconSm"
        disabled={!canRejectEvent(event, now)}
        onClick={() => openReject(event.id)}
        aria-label={`${t("Admin_Reject")}: ${event.title}`}
        title={t(rejectHintKey(event, now))}
      >
        <X size={17} />
      </Button>
    </div>
  );

  const endedBadge = (event: AdminEvent) =>
    isEventPast(event.eventDate, now) ? <Badge tone="neutral">{t("Admin_Ended")}</Badge> : null;

  return (
    <>
      <PageHeader title={t("Admin_EventsTitle")} description={t("Admin_EventsDescription")} />
      {message && <Alert className="mb-5">{message}</Alert>}

      <DataPanel
        toolbar={
          <>
            <Segmented
              ariaLabel={t("Admin_Status")}
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
              options={[
                { value: "all", label: t("Admin_All"), count: events.length },
                { value: "pending", label: t("Admin_Status_Pending"), count: counts[EventStatus.Pending] ?? 0 },
                { value: "approved", label: t("Admin_Status_Approved"), count: counts[EventStatus.Approved] ?? 0 },
                { value: "rejected", label: t("Admin_Status_Rejected"), count: counts[EventStatus.Rejected] ?? 0 },
                { value: "cancelled", label: t("Admin_Status_Cancelled"), count: counts[EventStatus.Cancelled] ?? 0 },
              ]}
            />
            <SearchInput
              className="xl:w-64"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder={t("Admin_SearchPlaceholder")}
              aria-label={t("Admin_SearchPlaceholder")}
            />
          </>
        }
      >
        {loading ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <EmptyState className="m-4 border-none" icon={<CalendarSearch size={22} />} title={t("Admin_NoEventsFound")} />
        ) : (
          <>
            <ul className="divide-y divide-ink-100 border-b border-ink-100 md:hidden">
              {visible.map((event) => (
                <li key={event.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words text-ink-900">{event.title}</p>
                      <p className="mt-0.5 text-[13px] text-ink-500">{event.organizerName ?? t("Admin_Unknown")}</p>
                    </div>
                    <EventStatusBadge status={event.status} isDeleted={event.isDeleted} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[13px] text-ink-500">
                      {formatDate(event.eventDate, i18n.language)}
                      {endedBadge(event)}
                    </span>
                    {actionButtons(event)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Event")}</th>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Organizer")}</th>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Date")}</th>
                    <th scope="col" className={tableHeadClass}>{t("Admin_Status")}</th>
                    <th scope="col" className={`${tableHeadClass} text-right`}>{t("Admin_Actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((event) => (
                    <tr key={event.id} className="transition-colors hover:bg-ink-50/70">
                      <td className={`${tableCellClass} max-w-64`}>
                        <p className="truncate font-semibold text-ink-900">{event.title}</p>
                        <p className="mt-0.5 truncate text-[13px] text-ink-500">
                          {event.categoryName ? formatCategoryName(event.categoryName, t) : t("Admin_CategoryMissing")}
                        </p>
                      </td>
                      <td className={`${tableCellClass} text-ink-600`}>{event.organizerName ?? t("Admin_Unknown")}</td>
                      <td className={`${tableCellClass} whitespace-nowrap text-ink-600 tabular-nums`}>
                        <span className="flex items-center gap-2">
                          {formatDate(event.eventDate, i18n.language)}
                          {endedBadge(event)}
                        </span>
                      </td>
                      <td className={tableCellClass}>
                        <EventStatusBadge status={event.status} isDeleted={event.isDeleted} />
                      </td>
                      <td className={tableCellClass}>{actionButtons(event)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onChange={setPage}
            />
          </>
        )}
      </DataPanel>

      {selected && (
        <Modal
          open
          bare
          size="xl"
          ariaLabel={t("Admin_EventDetails_Title")}
          onClose={() => setSelected(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>
                {t("Admin_Close")}
              </Button>
              <Button
                variant="dangerSoft"
                disabled={!canRejectEvent(selected, now)}
                title={t(rejectHintKey(selected, now))}
                onClick={() => openReject(selected.id)}
              >
                <X size={16} aria-hidden="true" />
                {t("Admin_Reject")}
              </Button>
              <Button
                disabled={!canApproveEvent(selected, now)}
                loading={busyId === selected.id}
                title={t(approveHintKey(selected, now))}
                onClick={() => void approve(selected.id)}
              >
                {busyId !== selected.id && <Check size={16} aria-hidden="true" />}
                {t("Admin_Approve")}
              </Button>
            </>
          }
        >
          <div className="aspect-[3/1] w-full overflow-hidden bg-ink-100">
            <EventCover title={selected.title} imageUrl={selected.imageUrl} categoryName={selected.categoryName} />
          </div>
          <div className="space-y-5 px-5 py-5 sm:px-6">
            <div>
              <EventStatusBadge status={selected.status} isDeleted={selected.isDeleted} className="mb-2.5" />
              <h2 className="text-xl leading-snug font-bold text-ink-900">{selected.title}</h2>
            </div>
            <EventReasons event={selected} />
            <EventFacts event={selected} />
            <section className="border-t border-ink-100 pt-5">
              <h3 className="text-sm font-semibold text-ink-900">{t("Admin_DescriptionLabel")}</h3>
              <p className="mt-2 text-sm leading-relaxed break-words whitespace-pre-line text-ink-600">
                {detailLoading && !selected.description
                  ? t("Admin_LoadingDetails")
                  : selected.description || t("Admin_NoDescription")}
              </p>
            </section>
          </div>
        </Modal>
      )}

      <Modal
        open={Boolean(rejectId)}
        onClose={() => setRejectId(null)}
        dismissible={!rejecting}
        title={t("Admin_Reject_Modal_Title")}
        description={t("Admin_Reject_Modal_Desc")}
        icon={
          <IconTile tone="danger">
            <X size={19} />
          </IconTile>
        }
      >
        <form onSubmit={confirmReject} className="space-y-4">
          <Field label={t("Admin_Rejection_Reason")} error={rejectError} required>
            <Textarea
              rows={4}
              value={rejectReason}
              aria-invalid={Boolean(rejectError)}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (rejectError) setRejectError("");
              }}
              placeholder={t("Admin_Reject_Placeholder")}
            />
          </Field>
          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => setRejectId(null)} disabled={rejecting}>
              {t("Admin_Cancel")}
            </Button>
            <Button type="submit" variant="danger" loading={rejecting}>
              {rejecting ? t("Admin_Rejecting") : t("Admin_Reject_Confirm")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
