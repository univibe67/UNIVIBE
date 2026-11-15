import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Eye,
  GraduationCap,
  LoaderCircle,
  MapPin,
  MessageSquare,
  Search,
  ShieldAlert,
  Tag,
  User,
  Users,
  X,
} from "lucide-react";
import { adminApi } from "../../services/adminApi";
import type { AdminEvent, AdminFeedback, AdminUser } from "../../services/adminApi";
import { adminStore, useAdminStore } from "../../services/adminStore";
import { getErrorMessage } from "../../services/errorMessage";
import { formatUserRole, normalizeRole, roleValue } from "../../utils/userRole";
import { formatCategoryName } from "../../utils/categoryLabel";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`rounded-2xl border border-[#e3e9e5] bg-white p-5 shadow-[0_5px_16px_#17212b0b] ${className}`}>{children}</section>
);

function Notice({ text }: { text: string }) {
  return <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#fecaca] bg-[#fff0f2] p-3 text-sm text-[#b42318]"><AlertCircle size={17} />{text}</div>;
}

function Loading({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-12 text-[#1559ac]"><LoaderCircle className="animate-spin" />{label}</div>;
}

function Overview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, users, feedbacks, error } = useAdminStore();

  useEffect(() => {
    void adminStore.refresh();
  }, []);

  const pendingEventsCount = stats.pendingEvents ?? 0;
  const totalFeedbacksCount = feedbacks.length;
  const totalUsersCount = users.length;
  const activeUsersCount = users.filter((u) => u.isActive).length;
  const suspendedUsersCount = users.filter((u) => !u.isActive).length;

  const cards = [
    [t("Admin_TotalUsers"), totalUsersCount, Users],
    [t("Admin_TotalEvents"), stats.totalCreatedEvents, Clock],
    [t("Admin_ActiveEvents"), stats.activeEvents, CheckCircle],
    [t("Admin_PendingEvents"), pendingEventsCount, ShieldAlert],
  ] as const;

  return (
    <>
      {error && <Notice text={error} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <Card key={label} className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf2ff] text-[#1559ac]">
              <Icon size={22} />
            </div>
            <div>
              <p className="text-xs font-bold text-[#819098]">{label}</p>
              <p className="mt-1 text-2xl font-extrabold">{value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#f0f3f1] pb-4 mb-5">
          <div>
            <h2 className="text-lg font-extrabold text-[#17212b]">{t("Admin_OverviewSummaryTitle")}</h2>
            <p className="text-xs text-[#819098] mt-0.5">{t("Admin_OverviewSummarySubtitle")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#ecfdf3] px-3 py-1 text-xs font-bold text-[#16804b]">
            <span className="h-2 w-2 rounded-full bg-[#16804b] animate-pulse" />
            {t("Admin_Summary_LiveStatus")}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Onay Bekleyen Etkinlikler */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/admin/events")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/admin/events")}
            className={`group flex flex-col justify-between rounded-xl border p-4 transition cursor-pointer ${
              pendingEventsCount > 0
                ? "border-[#fed7aa] bg-[#fffaf5] hover:border-[#f97316] hover:shadow-sm"
                : "border-[#e3e9e5] bg-[#fbfdfb] hover:border-[#1559ac] hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
                    pendingEventsCount > 0
                      ? "bg-[#fff0e6] text-[#c66a16]"
                      : "bg-[#ecfdf3] text-[#16804b]"
                  }`}
                >
                  {pendingEventsCount > 0 ? <ShieldAlert size={19} /> : <CheckCircle size={19} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#819098]">{t("Admin_Summary_EventsHeading")}</p>
                  <p className="text-sm font-extrabold text-[#17212b]">
                    {pendingEventsCount > 0
                      ? t("Admin_Summary_PendingEvents", { count: pendingEventsCount }).replace("{{count}}", String(pendingEventsCount))
                      : t("Admin_Summary_NoPendingEvents")}
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-[#9aa5a9] transition group-hover:translate-x-1 group-hover:text-[#1559ac] shrink-0" />
            </div>
            <p className="mt-3 text-xs text-[#819098]">
              {pendingEventsCount > 0 ? t("Admin_Summary_ClickToReviewEvents") : t("Admin_Summary_EventsUpToDate")}
            </p>
          </div>

          {/* Geri Bildirimler */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/admin/feedback")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/admin/feedback")}
            className="group flex flex-col justify-between rounded-xl border border-[#e3e9e5] bg-[#fbfdfb] p-4 transition hover:border-[#1559ac] hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf2ff] text-[#1559ac]">
                  <MessageSquare size={19} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#819098]">{t("Admin_Summary_FeedbackHeading")}</p>
                  <p className="text-sm font-extrabold text-[#17212b]">
                    {totalFeedbacksCount > 0
                      ? t("Admin_Summary_TotalFeedback", { count: totalFeedbacksCount }).replace("{{count}}", String(totalFeedbacksCount))
                      : t("Admin_Summary_NoFeedbackYet")}
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-[#9aa5a9] transition group-hover:translate-x-1 group-hover:text-[#1559ac] shrink-0" />
            </div>
            <p className="mt-3 text-xs text-[#819098]">
              {totalFeedbacksCount > 0 ? t("Admin_Summary_ClickToReviewFeedback") : t("Admin_Summary_FeedbackUpToDate")}
            </p>
          </div>

          {/* Kullanıcı Durumu */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => navigate("/admin/users")}
            onKeyDown={(e) => e.key === "Enter" && navigate("/admin/users")}
            className="group flex flex-col justify-between rounded-xl border border-[#e3e9e5] bg-[#fbfdfb] p-4 transition hover:border-[#1559ac] hover:shadow-sm cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eaf2ff] text-[#1559ac]">
                  <Users size={19} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#819098]">{t("Admin_Summary_UsersHeading")}</p>
                  <p className="text-sm font-extrabold text-[#17212b]">
                    {t("Admin_Summary_UserStats", {
                      active: activeUsersCount,
                      suspended: suspendedUsersCount,
                      total: totalUsersCount,
                    })
                      .replace("{{active}}", String(activeUsersCount))
                      .replace("{{suspended}}", String(suspendedUsersCount))
                      .replace("{{total}}", String(totalUsersCount))}
                  </p>
                </div>
              </div>
              <ChevronRight size={17} className="text-[#9aa5a9] transition group-hover:translate-x-1 group-hover:text-[#1559ac] shrink-0" />
            </div>
            <p className="mt-3 text-xs text-[#819098]">
              {suspendedUsersCount > 0
                ? t("Admin_Summary_SuspendedWarning", { count: suspendedUsersCount }).replace("{{count}}", String(suspendedUsersCount))
                : t("Admin_Summary_AllUsersActive")}
            </p>
          </div>
        </div>
      </Card>
    </>
  );
}

function Events() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.getEvents(), adminApi.getPendingEvents()])
      .then(([all, pending]) => {
        const combined = [...pending, ...all.filter((event) => !pending.some((item) => item.id === event.id))];
        setEvents(combined);
        adminStore.setEvents(combined);
      })
      .catch((e) => setMessage(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(
    () => events.filter((event) => `${event.title} ${event.organizerName ?? ""}`.toLowerCase().includes(search.toLowerCase())),
    [events, search]
  );

  const isEventApproved = (status?: string | number | null) => {
    const value = String(status ?? "").toLowerCase().trim();
    return value === "2" || value === "approved" || value === "onaylandi" || value === "onaylandı";
  };

  const isEventRejected = (status?: string | number | null) => {
    const value = String(status ?? "").toLowerCase().trim();
    return value === "3" || value === "rejected" || value === "reddedildi";
  };

  const statusLabel = (status?: string | number | null) => {
    if (isEventApproved(status)) {
      return [t("Admin_Status_Approved") || (i18n.language.startsWith("en") ? "Approved" : "Onaylandı"), "bg-[#ecfdf3] text-[#16804b]"];
    }
    if (isEventRejected(status)) {
      return [t("Admin_Status_Rejected") || (i18n.language.startsWith("en") ? "Rejected" : "Reddedildi"), "bg-[#fff0f2] text-[#d73f55]"];
    }
    const value = String(status ?? "").toLowerCase().trim();
    if (value === "4" || value === "cancelled" || value === "canceled" || value === "iptal" || value === "iptal edildi") {
      return [t("Admin_Status_Cancelled") || (i18n.language.startsWith("en") ? "Cancelled" : "İptal Edildi"), "bg-gray-100 text-gray-700"];
    }
    if (value === "5" || value === "completed" || value === "tamamlandi" || value === "tamamlandı") {
      return [t("Admin_Status_Completed") || (i18n.language.startsWith("en") ? "Completed" : "Tamamlandı"), "bg-[#eaf2ff] text-[#1559ac]"];
    }
    // 1 (Pending) veya bilinmeyen/boş/0 olan tüm değerler onay bekliyor kabul edilir (sarı/turuncu rozet)
    return [t("Admin_Status_Pending") || (i18n.language.startsWith("en") ? "Pending" : "Onay Bekliyor"), "bg-[#fff4e8] text-[#c66a16]"];
  };

  const update = async (action: () => Promise<unknown>) => {
    try {
      await action();
      void adminStore.refresh();
      load();
    } catch (e) {
      setMessage(getErrorMessage(e));
    }
  };

  const handleApprove = async (eventId: string) => {
    adminStore.approveEvent(eventId);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 2 } : e)));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: 2 } : null));
    }
    await update(() => adminApi.approveEvent(eventId));
  };

  const handleReject = async (eventId: string) => {
    const reason = window.prompt(t("Admin_RejectReasonPrompt") || "Reddetme sebebi giriniz:");
    if (!reason?.trim()) return;
    adminStore.rejectEvent(eventId, reason);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: 3, rejectionReason: reason } : e)));
    if (selectedEvent && selectedEvent.id === eventId) {
      setSelectedEvent((prev) => (prev ? { ...prev, status: 3, rejectionReason: reason } : null));
    }
    await update(() => adminApi.rejectEvent(eventId, reason));
  };

  const handleViewDetails = async (event: AdminEvent) => {
    setSelectedEvent(event);
    setIsDetailModalOpen(true);
    setDetailLoading(true);
    try {
      const detail = await adminApi.getEvent(event.id);
      setSelectedEvent((prev) => ({
        ...prev,
        ...detail,
        status: detail.status ?? event.status ?? 1,
        organizerName: detail.organizerName ?? detail.creatorName ?? prev?.organizerName ?? event.organizerName,
      }));
    } catch (e) {
      setMessage(getErrorMessage(e));
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      {message && <Notice text={message} />}
      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold">{t("Admin_Events")}</h2>
          <div className="relative sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa5a9]" size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Admin_SearchEvents")}
              className="w-full rounded-xl border border-[#e3e9e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#1559ac]"
            />
          </div>
        </div>
        {loading ? (
          <Loading label={t("Admin_Loading")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e8eeea] text-xs text-[#819098]">
                  <th className="pb-3">{t("Admin_Event")}</th>
                  <th className="pb-3">{t("Admin_Organizer")}</th>
                  <th className="pb-3">{t("Admin_Date")}</th>
                  <th className="pb-3">{t("Admin_Status")}</th>
                  <th className="pb-3 text-right">{t("Admin_Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => {
                  const [label, badge] = statusLabel(event.status);
                  return (
                    <tr key={event.id} className="border-b border-[#f0f3f1]">
                      <td className="py-4 font-bold">
                        {event.title}
                        <small className="mt-1 block font-normal text-[#819098]">
                          {event.categoryName ? formatCategoryName(event.categoryName, t) : t("Admin_CategoryMissing")}
                        </small>
                      </td>
                      <td className="py-4 text-[#718089]">{event.organizerName ?? t("Admin_Unknown")}</td>
                      <td className="py-4 text-[#718089]">
                        {new Date(event.eventDate).toLocaleDateString(i18n.language.startsWith("en") ? "en-US" : "tr-TR")}
                      </td>
                      <td className="py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${badge}`}>{label}</span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => void handleViewDetails(event)}
                            className="rounded-lg bg-[#f0f3f1] p-2 text-[#718089] hover:bg-[#e3e9e5] hover:text-[#17212b] transition"
                            title={t("Admin_ViewDetails")}
                          >
                            <Eye size={17} />
                          </button>
                          {!isEventApproved(event.status) && (
                            <button
                              onClick={() => void handleApprove(event.id)}
                              className="rounded-lg bg-[#ecfdf3] p-2 text-[#16804b] hover:bg-[#d4f8e3] transition cursor-pointer"
                              title={t("Admin_Approve") || "Onayla"}
                            >
                              <Check size={17} />
                            </button>
                          )}
                          {!isEventRejected(event.status) && (
                            <button
                              onClick={() => void handleReject(event.id)}
                              className="rounded-lg bg-[#fff0f2] p-2 text-[#d73f55] hover:bg-[#ffe2e6] transition cursor-pointer"
                              title={t("Admin_Reject") || "Reddet"}
                            >
                              <X size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="py-10 text-center text-sm text-[#819098]">{t("Admin_NoEventsFound")}</p>
            )}
          </div>
        )}
      </Card>

      {/* Event Detail Modal */}
      {isDetailModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto border border-[#e3e9e5]">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 rounded-xl p-2 text-[#819098] hover:bg-[#f5f7f5] hover:text-[#17212b] transition"
              title={t("Admin_Close")}
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#e8eeea] pb-4">
              <h2 className="text-xl font-extrabold text-[#17212b]">{t("Admin_EventDetails_Title")}</h2>
              {selectedEvent.status !== undefined && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${statusLabel(selectedEvent.status)[1]}`}>
                  {statusLabel(selectedEvent.status)[0]}
                </span>
              )}
              {detailLoading && (
                <LoaderCircle size={16} className="animate-spin text-[#1559ac]" />
              )}
            </div>

            <div className="mt-4 space-y-4">
              {selectedEvent.rejectionReason && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#fecaca] bg-[#fff0f2] p-3 text-sm text-[#d73f55]">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wide">
                      {t("Admin_Rejection_Reason")}
                    </strong>
                    <p className="mt-0.5">{selectedEvent.rejectionReason}</p>
                  </div>
                </div>
              )}

              {selectedEvent.cancellationReason && (
                <div className="flex items-start gap-2.5 rounded-xl border border-gray-300 bg-gray-100 p-3 text-sm text-gray-700">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs font-extrabold uppercase tracking-wide">
                      {t("Admin_Cancellation_Reason")}
                    </strong>
                    <p className="mt-0.5">{selectedEvent.cancellationReason}</p>
                  </div>
                </div>
              )}

              {selectedEvent.imageUrl && (
                <img
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  className="max-h-64 w-full rounded-xl object-cover border border-[#e3e9e5]"
                />
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-xs font-bold text-[#1559ac] flex items-center gap-1">
                    <Tag size={12} />
                    {selectedEvent.categoryName ? formatCategoryName(selectedEvent.categoryName, t) : t("Admin_NoCategory")}
                  </span>
                </div>
                <h3 className="mt-2 text-2xl font-extrabold text-[#17212b]">{selectedEvent.title}</h3>
              </div>

              {selectedEvent.description && (
                <div className="rounded-xl border border-[#e8eeea] bg-[#f9faf9] p-4 text-sm">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#819098] mb-1">
                    {t("Admin_DescriptionLabel")}
                  </span>
                  <p className="whitespace-pre-line leading-relaxed text-[#17212b]">{selectedEvent.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
                <div className="flex items-start gap-3 rounded-xl border border-[#e8eeea] bg-white p-3.5">
                  <Calendar size={18} className="mt-0.5 text-[#1559ac] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[#819098]">{t("Admin_Date")}</span>
                    <span className="font-semibold text-[#17212b]">
                      {new Date(selectedEvent.eventDate).toLocaleString(
                        i18n.language.startsWith("en") ? "en-US" : "tr-TR",
                        { dateStyle: "long", timeStyle: "short" }
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e8eeea] bg-white p-3.5">
                  <MapPin size={18} className="mt-0.5 text-[#ef3653] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[#819098]">{t("Admin_Location")}</span>
                    <span className="font-semibold text-[#17212b]">
                      {selectedEvent.location || t("Admin_NotSpecified")}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e8eeea] bg-white p-3.5">
                  <User size={18} className="mt-0.5 text-[#16804b] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[#819098]">{t("Admin_Organizer")}</span>
                    <span className="font-semibold text-[#17212b]">
                      {selectedEvent.creatorName || selectedEvent.organizerName || t("Admin_Unknown")}
                    </span>
                    {selectedEvent.department && (
                      <span className="block text-xs text-[#819098]">{selectedEvent.department}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-[#e8eeea] bg-white p-3.5">
                  <Users size={18} className="mt-0.5 text-[#c66a16] shrink-0" />
                  <div>
                    <span className="block text-xs font-bold text-[#819098]">
                      {t("Admin_Participants") || (i18n.language.startsWith("en") ? "Participants" : "Katılımcı")}
                    </span>
                    <span className="font-semibold text-[#17212b]">{selectedEvent.participantCount ?? 0}</span>
                  </div>
                </div>

                {(selectedEvent.targetFaculty || selectedEvent.targetDepartment) && (
                  <div className="sm:col-span-2 flex items-start gap-3 rounded-xl border border-[#e8eeea] bg-white p-3.5">
                    <GraduationCap size={18} className="mt-0.5 text-[#1559ac] shrink-0" />
                    <div>
                      <span className="block text-xs font-bold text-[#819098]">
                        {i18n.language.startsWith("en") ? "Target Audience" : "Hedef Kitle"}
                      </span>
                      <span className="font-semibold text-[#17212b]">
                        {[selectedEvent.targetFaculty, selectedEvent.targetDepartment].filter(Boolean).join(" - ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-[#e8eeea] pt-4">
              {!isEventApproved(selectedEvent.status) && (
                <button
                  type="button"
                  onClick={() => void handleApprove(selectedEvent.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#ecfdf3] px-4 py-2.5 text-sm font-bold text-[#16804b] hover:bg-[#d4f8e3] transition cursor-pointer"
                >
                  <Check size={16} /> {t("Admin_Approve") || "Onayla"}
                </button>
              )}
              {!isEventRejected(selectedEvent.status) && (
                <button
                  type="button"
                  onClick={() => void handleReject(selectedEvent.id)}
                  className="flex items-center gap-1.5 rounded-xl bg-[#fff0f2] px-4 py-2.5 text-sm font-bold text-[#d73f55] hover:bg-[#ffe2e6] transition cursor-pointer"
                >
                  <X size={16} /> {t("Admin_Reject") || "Reddet"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="rounded-xl bg-[#f0f3f1] px-5 py-2.5 text-sm font-bold text-[#718089] hover:bg-[#e3e9e5] hover:text-[#17212b] transition cursor-pointer"
              >
                {t("Admin_Close") || "Kapat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UsersPage() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const load = () =>
    adminApi
      .getUsers()
      .then((data) => {
        setUsers(data);
        adminStore.setUsers(data);
      })
      .catch((e) => setMessage(getErrorMessage(e)));
  useEffect(() => { void load(); }, []);
  const currentId = (() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return "";
      const parts = token.split(".");
      if (parts.length < 2) return "";
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = (4 - (base64.length % 4)) % 4;
      const json = JSON.parse(window.atob(base64 + "=".repeat(pad)));
      const id =
        json.sub ??
        json.nameid ??
        json["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
        "";
      return String(id).toLowerCase();
    } catch {
      return "";
    }
  })();
  const filtered = users.filter((user) => `${user.firstName ?? ""} ${user.lastName ?? ""} ${user.email ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const action = async (work: () => Promise<unknown>) => {
    try {
      await work();
      void adminStore.refresh();
      load();
    } catch (e) {
      setMessage(getErrorMessage(e));
    }
  };
  const updateRole = (user: AdminUser, value: string) => {
    const newRole = roleValue(value);
    if (newRole === null) {
      setMessage(t("Admin_InvalidRole"));
      return;
    }
    adminStore.updateUserRole(user.id, newRole);
    void action(() => adminApi.changeUserRole(user.id, newRole));
  };
  return (
    <>
      {message && <Notice text={message} />}
      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-extrabold">{t("Admin_Users")}</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("Admin_SearchUsers")}
            className="rounded-xl border border-[#e3e9e5] px-3 py-2.5 text-sm outline-none focus:border-[#1559ac] sm:w-72"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e8eeea] text-xs text-[#819098]">
                <th className="pb-3">{t("Admin_User")}</th>
                <th className="pb-3">{t("Admin_Email")}</th>
                <th className="pb-3">{t("Admin_Role")}</th>
                <th className="pb-3">{t("Admin_Status")}</th>
                <th className="pb-3 text-right">{t("Admin_Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const normalizedRole = normalizeRole(user.role);
                const self = user.id.toLowerCase() === currentId;
                return (
                  <tr key={user.id} className="border-b border-[#f0f3f1]">
                    <td className="py-4 font-bold" translate="no">
                      <span className="block">{user.firstName} {user.lastName}</span>
                      {user.title && <span className="text-xs font-normal text-[#819098]">{user.title}</span>}
                    </td>
                    <td className="py-4 text-[#718089]" translate="no">{user.email}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-[#eaf2ff] px-2.5 py-1 text-xs font-bold text-[#1559ac]">
                        {formatUserRole(user.role, t)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={user.isActive ? "text-[#16804b]" : "text-[#d73f55]"}>
                        {user.isActive ? t("Admin_Active") : t("Admin_Suspended")}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {self ? (
                        <div className="flex justify-end">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eaf2ff] px-2.5 py-1 text-xs font-bold text-[#1559ac] border border-[#d6e4f9]">
                            <User size={13} className="shrink-0" />
                            {t("Admin_CurrentAccountBadge") || (i18n.language.startsWith("en") ? "Current Account (You)" : "Mevcut Hesabınız (Siz)")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <select
                            value={normalizedRole ?? ""}
                            onChange={(event) => updateRole(user, event.target.value)}
                            className="rounded-lg border border-[#e3e9e5] bg-white px-2 py-2 text-xs font-bold text-[#1559ac] outline-none focus:border-[#1559ac]"
                          >
                            <option value="Student">{t("Role_Student")}</option>
                            <option value="Teacher">{t("Role_Teacher")}</option>
                            <option value="Admin">{t("Role_Admin")}</option>
                          </select>
                          <button
                            onClick={() => {
                              adminStore.updateUserStatus(user.id, !user.isActive);
                              void action(() => (user.isActive ? adminApi.suspendUser(user.id) : adminApi.activateUser(user.id)));
                            }}
                            className={`rounded-lg px-3 py-2 text-xs font-bold ${user.isActive ? "bg-[#fff0f2] text-[#d73f55]" : "bg-[#ecfdf3] text-[#16804b]"}`}
                          >
                            {user.isActive ? t("Admin_Suspend") : t("Admin_Activate")}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="py-10 text-center text-sm text-[#819098]">{t("Admin_NoUsersFound")}</p>}
        </div>
      </Card>
    </>
  );
}

function Feedback() {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = () => {
    setLoading(true);
    return adminApi
      .getFeedbacks()
      .then((data) => {
        setItems(data);
        adminStore.setFeedbacks(data);
      })
      .catch((e) => setMessage(getErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      {message && <Notice text={message} />}
      {loading ? (
        <Loading label={t("Admin_Loading")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => {
            const emailMatch = item.message?.match(/^\[Gönderen E-posta:\s*([^\]]+)\]/i);
            const extractedEmail = emailMatch ? emailMatch[1].trim() : null;
            const cleanMessage = emailMatch
              ? item.message?.replace(/^\[Gönderen E-posta:\s*[^\]]+\]\s*/i, "")
              : item.message;
            const hasRealUserName =
              item.userFullName &&
              item.userFullName !== "Unknown" &&
              item.userFullName.trim().length > 0;
            const senderDisplay = hasRealUserName
              ? item.userFullName
              : (extractedEmail || t("Admin_Unknown"));

            return (
              <Card key={item.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-bold text-[#ef3653]" translate="no">
                      {senderDisplay}
                    </p>
                    {hasRealUserName && extractedEmail && (
                      <span className="text-[11px] text-[#718089]">({extractedEmail})</span>
                    )}
                    {extractedEmail && !hasRealUserName && (
                      <span className="rounded-md bg-[#eaf2ff] px-2 py-0.5 text-[10px] font-bold text-[#1559ac]">
                        {t("Feedback_GuestBadge") || "Giriş Ekranı"}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1.5 text-lg font-extrabold text-[#17212b]">{item.subject ?? t("Admin_FeedbackDefaultSubject")}</h2>
                  <p className="mt-3 text-sm leading-6 text-[#718089] whitespace-pre-wrap">{cleanMessage}</p>
                </div>
                <div className="mt-5 flex items-center gap-2 border-t border-[#f0f3f1] pt-4 text-xs text-[#9aa5a9]">
                  <Calendar size={14} className="text-[#9aa5a9] shrink-0" />
                  <span>{new Date(item.createdAt).toLocaleDateString(i18n.language.startsWith("en") ? "en-US" : "tr-TR")}</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      {!loading && !items.length && (
        <Card><p className="text-center text-sm text-[#819098]">{t("Admin_NoFeedback")}</p></Card>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const path = useLocation().pathname;
  if (path.endsWith("/events")) return <Events />;
  if (path.endsWith("/users")) return <UsersPage />;
  if (path.endsWith("/feedback")) return <Feedback />;
  return <Overview />;
}
