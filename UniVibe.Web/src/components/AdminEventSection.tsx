import { useState } from "react";
import { CalendarDays, Clock, CheckCircle, XCircle, Eye, X, Calendar, User, Tag, AlertTriangle, Ban, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";

interface EventItem {
  id: string;
  title: string;
  organizerName?: string;
  eventDate: string;
  status: string | number;
  isDeleted?: boolean;
  rejectionReason?: string;
}

interface AdminEventSectionProps {
  events: EventItem[];
  isLoading: boolean;
  eventFilter: "all" | "pending" | "approved" | "rejected" | "cancelled";
  setEventFilter: (filter: "all" | "pending" | "approved" | "rejected" | "cancelled") => void;
  processedEvents: EventItem[];
  currentEventsOnPage: EventItem[];
  currentEventPage: number;
  totalEventPages: number;
  setCurrentEventPage: React.Dispatch<React.SetStateAction<number>>;
  indexOfFirstEvent: number;
  indexOfLastEvent: number;
  localeStr: string;
  handleApproveEvent: (id: string) => void;
  fetchEvents?: () => void;
}

export default function AdminEventSection({
  isLoading,
  eventFilter,
  setEventFilter,
  processedEvents,
  currentEventsOnPage,
  currentEventPage,
  totalEventPages,
  setCurrentEventPage,
  indexOfFirstEvent,
  indexOfLastEvent,
  localeStr,
  handleApproveEvent,
}: AdminEventSectionProps) {
  const { t } = useTranslation();

  const [selectedEventDetail, setSelectedEventDetail] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [eventToRejectId, setEventToRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectError, setRejectError] = useState("");

  const handleOpenDetail = async (eventItem: EventItem) => {
    setDetailLoading(true);
    setSelectedEventDetail(eventItem);
    setIsDetailModalOpen(true);

    try {
      const response = (await api.get(`/AdminEvent/${eventItem.id}`)) as any;
      const fetchedData = response.data || response;
      
      setSelectedEventDetail({
        ...fetchedData,
        isDeleted: eventItem.isDeleted ?? fetchedData.isDeleted,
        rejectionReason: eventItem.rejectionReason || fetchedData.rejectionReason,
        status: eventItem.status ?? fetchedData.status,
      });
    } catch (error) {
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenRejectModal = (id: string) => {
    setEventToRejectId(id);
    setRejectReason("");
    setRejectError("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason || !rejectReason.trim()) {
      setRejectError(t("Admin_Reason_Required") || "Lütfen bir red nedeni giriniz.");
      return;
    }

    setRejectError("");
    setIsRejecting(true);
    try {
      await api.put(`/AdminEvent/reject/${eventToRejectId}`, { reason: rejectReason });
      setRejectModalOpen(false);
      window.location.reload();
    } catch (error: any) {
      setRejectError(error?.response?.data?.message || t("Admin_Error_Reject") || "İşlem sırasında bir hata oluştu.");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 sm:pb-0 mb-4 sm:mb-6 custom-scrollbar w-full">
        <div className="flex gap-2 bg-white p-1.5 sm:p-2 rounded-lg border border-gray-100 shadow-sm min-w-max">
          <button
            type="button"
            onClick={() => setEventFilter("all")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${eventFilter === "all" ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t("Admin_All")}
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("pending")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "pending" ? "bg-orange-100 text-orange-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Clock size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Pending")}
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("approved")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "approved" ? "bg-green-100 text-green-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <CheckCircle size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Approved")}
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("rejected")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "rejected" ? "bg-red-100 text-red-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <XCircle size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Rejected")}
          </button>
          <button
            type="button"
            onClick={() => setEventFilter("cancelled")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "cancelled" ? "bg-gray-200 text-gray-800 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Ban size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Cancelled") || "İptal Edildi"}
          </button>
        </div>
      </div>

      {processedEvents.length === 0 && !isLoading ? (
        <div className="text-center py-10 sm:py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <CalendarDays className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3" />
          <p className="text-sm sm:text-base text-gray-500 font-medium">
            {t("Admin_NoEventsFound")}
          </p>
        </div>
      ) : (
        <>
          <div className="md:hidden space-y-4">
            {currentEventsOnPage.map((event) => {
              const statusStr = String(event.status).toLowerCase();
              const isPending = event.status === 1 || statusStr === "pending";
              const isApproved = event.status === 2 || statusStr === "approved";
              const isCancelled = event.isDeleted || event.status === 4 || statusStr === "cancelled";
              const isPast = new Date(event.eventDate).getTime() < new Date().getTime();

              return (
                <div
                  key={event.id}
                  className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition-opacity ${isPast ? "opacity-60 grayscale-[30%] border-gray-200" : "border-gray-100"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2">
                    <div className="w-full">
                      <div className="flex justify-between items-start w-full gap-2">
                        <h3 className="font-bold text-gray-800 text-base flex-1 break-words">
                          {event.title}
                        </h3>
                        <div>
                          {isCancelled ? (
                            <span className="bg-gray-100 text-gray-600 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Cancelled")}
                            </span>
                          ) : isPending ? (
                            <span className="bg-orange-100 text-orange-700 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Pending")}
                            </span>
                          ) : isApproved ? (
                            <span className="bg-green-100 text-green-700 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Approved")}
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-700 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Rejected")}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.organizerName || t("Admin_Unknown")}
                        {isPast && (
                          <span className="ml-2 inline-block text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase font-bold">
                            {t("Admin_Ended")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-3 border-t border-gray-50">
                    <span className="text-xs font-medium text-gray-500">
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleDateString(localeStr, {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : t("Admin_NoDate")}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(event)}
                        className="p-1.5 sm:p-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        title={t("Admin_ViewDetails")}
                      >
                        <Eye size={18} />
                      </button>

                      {isPending && !isPast && !isCancelled && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveEvent(event.id)}
                            className="p-1.5 sm:p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title={t("Admin_Approve")}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenRejectModal(event.id)}
                            className="p-1.5 sm:p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title={t("Admin_Reject")}
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">{t("Admin_EventName")}</th>
                  <th className="pb-3 font-medium">{t("Admin_Organizer")}</th>
                  <th className="pb-3 font-medium">{t("Admin_Date")}</th>
                  <th className="pb-3 font-medium">{t("Admin_Status")}</th>
                  <th className="pb-3 font-medium text-right">{t("Admin_Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {currentEventsOnPage.map((event) => {
                  const statusStr = String(event.status).toLowerCase();
                  const isPending = event.status === 1 || statusStr === "pending";
                  const isApproved = event.status === 2 || statusStr === "approved";
                  const isCancelled = event.isDeleted || event.status === 4 || statusStr === "cancelled";
                  const isPast = new Date(event.eventDate).getTime() < new Date().getTime();

                  return (
                    <tr
                      key={event.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${isPast ? "bg-gray-50/50 opacity-75" : ""}`}
                    >
                      <td className="py-4 font-medium text-gray-800 flex items-center gap-2">
                        {event.title}
                        {isPast && (
                          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">
                            {t("Admin_Ended")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-gray-600">
                        {event.organizerName || t("Admin_Unknown")}
                      </td>
                      <td className="py-4 text-gray-600">
                        {event.eventDate
                          ? new Date(event.eventDate).toLocaleDateString(localeStr, {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : t("Admin_NoDate")}
                      </td>
                      <td className="py-4">
                        {isCancelled ? (
                          <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Cancelled")}
                          </span>
                        ) : isPending ? (
                          <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Pending")}
                          </span>
                        ) : isApproved ? (
                          <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Approved")}
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Rejected")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right flex justify-end gap-2 items-center">
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(event)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t("Admin_ViewDetails")}
                        >
                          <Eye size={20} />
                        </button>

                        {isPending && !isPast && !isCancelled && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveEvent(event.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={t("Admin_Approve")}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenRejectModal(event.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t("Admin_Reject")}
                            >
                              <XCircle size={20} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalEventPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-5 sm:pt-6 mt-4 sm:mt-6 gap-4">
              <p className="text-xs sm:text-sm text-gray-500 text-center sm:text-left w-full sm:w-auto">
                {t("Admin_Pagination_Info", {
                  start: indexOfFirstEvent + 1,
                  end: Math.min(indexOfLastEvent, processedEvents.length),
                  total: processedEvents.length,
                })}
              </p>

              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentEventPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentEventPage === 1}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                >
                  {t("Admin_Previous")}
                </button>
                <div className="flex items-center justify-center px-3 sm:px-4 font-medium text-xs sm:text-sm text-gray-800 bg-gray-50 rounded-lg border border-gray-100 py-2">
                  {currentEventPage} / {totalEventPages}
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentEventPage((prev) => Math.min(prev + 1, totalEventPages))}
                  disabled={currentEventPage === totalEventPages}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                >
                  {t("Admin_Next")}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-gray-800 border-b pb-3">{t("Admin_EventDetails_Title")}</h2>

            {detailLoading && !selectedEventDetail ? (
              <div className="py-12 text-center text-gray-500 font-medium">{t("Admin_LoadingDetails")}</div>
            ) : selectedEventDetail ? (
              <div className="space-y-4">
                {selectedEventDetail.isDeleted || String(selectedEventDetail.status) === "4" || String(selectedEventDetail.status).toLowerCase() === "cancelled" ? (
                  <div className="bg-gray-100 border border-gray-300 text-gray-700 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-gray-600">
                      <AlertTriangle size={16} />
                      <span>{t("Admin_Cancellation_Status")}</span>
                    </div>
                    <p className="text-sm font-medium">
                      {t("Admin_Event_Cancelled_Notice") || "Bu etkinlik iptal edilmiştir."}
                    </p>
                  </div>
                ) : String(selectedEventDetail.status) === "3" || 
                    String(selectedEventDetail.status).toLowerCase() === "rejected" || 
                    selectedEventDetail.rejectionReason ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-red-600">
                      <AlertTriangle size={16} />
                      <span>{t("Admin_Rejection_Reason")}</span>
                    </div>
                    <p className="text-sm">
                      {selectedEventDetail.rejectionReason || t("Admin_No_Reason_Specified")}
                    </p>
                  </div>
                ) : null}

                <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{t("Admin_EventNameLabel")}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">{selectedEventDetail.title}</h3>
                </div>

                {selectedEventDetail.imageUrl ? (
                  <img
                    src={selectedEventDetail.imageUrl}
                    alt={selectedEventDetail.title}
                    className="w-full h-48 object-cover rounded-xl shadow-md border border-gray-100"
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm border border-dashed border-gray-200">
                    {t("Admin_NoImage")}
                  </div>
                )}

                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t("Admin_DescriptionLabel")}</span>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {selectedEventDetail.description || t("Admin_NoDescription")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl text-sm border border-gray-100">
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <Calendar size={16} className="text-blue-500 shrink-0" />
                    <span>
                      <strong>{t("Admin_DateLabel")}:</strong>{" "}
                      {selectedEventDetail.eventDate ? new Date(selectedEventDetail.eventDate).toLocaleDateString(localeStr, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : t("Admin_NoDate")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-700">
                    <Tag size={16} className="text-purple-500 shrink-0" />
                    <span>
                      <strong>{t("Admin_CategoryLabel")}:</strong> {selectedEventDetail.categoryName || t("Admin_NoCategory")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-700 sm:col-span-2">
                    <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>
                      <strong>{t("Admin_LocationLabel")}:</strong> {selectedEventDetail.location || t("Admin_NotSpecified")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-700 sm:col-span-2 border-t border-gray-200/60 pt-2.5 mt-1">
                    <User size={16} className="text-indigo-500 shrink-0" />
                    <span>
                      <strong>{t("Admin_OrganizerLabel")}:</strong> {selectedEventDetail.creatorName || t("Admin_Unknown")}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-xl transition-colors"
                >
                  {t("Admin_Close")}
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-red-500 font-medium">{t("Admin_FailedToLoadInfo")}</div>
            )}
          </div>
        </div>
      )}

      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-100 relative">
            
            <div className="flex items-center gap-3.5 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0 border border-red-100">
                <XCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {t("Admin_Reject_Modal_Title") || "Etkinliği Reddet"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {t("Admin_Reject_Modal_Desc") || "Lütfen bu etkinliğin neden reddedildiğini açıklayın."}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                {t("Admin_Rejection_Reason") || "Red Nedeni"}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError("");
                }}
                placeholder={t("Admin_Reject_Placeholder") || "Örn: Etkinlik kurallara uygun değil..."}
                className={`w-full p-3.5 border rounded-xl outline-none text-sm h-36 resize-none transition-all placeholder:text-gray-400 bg-gray-50/50 ${
                  rejectError ? "border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                }`}
              />
              {rejectError && (
                <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1.5 animate-shake">
                  <AlertTriangle size={14} className="shrink-0" /> 
                  <span>{rejectError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={isRejecting}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm border border-gray-200/60"
              >
                {t("Admin_Cancel") || "Vazgeç"}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-all text-sm shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRejecting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>{t("Admin_Rejecting") || "Reddediliyor..."}</span>
                  </>
                ) : (
                  <span>{t("Admin_Reject_Confirm") || "Reddet ve Gönder"}</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}