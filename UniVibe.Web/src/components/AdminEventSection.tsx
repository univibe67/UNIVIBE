import { CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface EventItem {
  id: string;
  title: string;
  organizerName?: string;
  eventDate: string;
  status: string | number;
}

interface AdminEventSectionProps {
  events: EventItem[];
  isLoading: boolean;
  eventFilter: "all" | "pending" | "approved" | "rejected";
  setEventFilter: (filter: "all" | "pending" | "approved" | "rejected") => void;
  processedEvents: EventItem[];
  currentEventsOnPage: EventItem[];
  currentEventPage: number;
  totalEventPages: number;
  setCurrentEventPage: React.Dispatch<React.SetStateAction<number>>;
  indexOfFirstEvent: number;
  indexOfLastEvent: number;
  localeStr: string;
  handleApproveEvent: (id: string) => void;
  handleRejectEvent: (id: string) => void;
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
  handleRejectEvent,
}: AdminEventSectionProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 sm:pb-0 mb-4 sm:mb-6 custom-scrollbar w-full">
        <div className="flex gap-2 bg-white p-1.5 sm:p-2 rounded-lg border border-gray-100 shadow-sm min-w-max">
          <button
            onClick={() => setEventFilter("all")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${eventFilter === "all" ? "bg-gray-800 text-white shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {t("Admin_All")}
          </button>
          <button
            onClick={() => setEventFilter("pending")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "pending" ? "bg-orange-100 text-orange-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <Clock size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Pending")}
          </button>
          <button
            onClick={() => setEventFilter("approved")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "approved" ? "bg-green-100 text-green-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <CheckCircle size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Approved")}
          </button>
          <button
            onClick={() => setEventFilter("rejected")}
            className={`whitespace-nowrap flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${eventFilter === "rejected" ? "bg-red-100 text-red-700 shadow" : "text-gray-500 hover:bg-gray-50"}`}
          >
            <XCircle size={14} className="sm:w-4 sm:h-4" /> {t("Admin_Status_Rejected")}
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
              const isRejected = event.status === 3 || statusStr === "rejected";
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
                          {isPending && (
                            <span className="bg-orange-100 text-orange-700 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Pending")}
                            </span>
                          )}
                          {isApproved && (
                            <span className="bg-green-100 text-green-700 py-1 px-2.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap">
                              {t("Admin_Status_Approved")}
                            </span>
                          )}
                          {isRejected && (
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
                      {isPending && !isPast && (
                        <>
                          <button
                            onClick={() => handleApproveEvent(event.id)}
                            className="p-1.5 sm:p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleRejectEvent(event.id)}
                            className="p-1.5 sm:p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                  const isRejected = event.status === 3 || statusStr === "rejected";
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
                        {isPending && (
                          <span className="bg-orange-100 text-orange-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Pending")}
                          </span>
                        )}
                        {isApproved && (
                          <span className="bg-green-100 text-green-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Approved")}
                          </span>
                        )}
                        {isRejected && (
                          <span className="bg-red-100 text-red-700 py-1 px-3 rounded-full text-xs font-medium">
                            {t("Admin_Status_Rejected")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right flex justify-end gap-2">
                        {isPending && !isPast && (
                          <>
                            <button
                              onClick={() => handleApproveEvent(event.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={t("Admin_Approve")}
                            >
                              <CheckCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleRejectEvent(event.id)}
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
                {i18n.language === "en" ? (
                  <>
                    Showing{" "}
                    <span className="font-bold text-gray-800">
                      {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, processedEvents.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-800">{processedEvents.length}</span> events.
                  </>
                ) : (
                  <>
                    Toplam{" "}
                    <span className="font-bold text-gray-800">{processedEvents.length}</span> etkinlikten{" "}
                    <span className="font-bold text-gray-800">
                      {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, processedEvents.length)}
                    </span>{" "}
                    arası gösteriliyor.
                  </>
                )}
              </p>

              <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-2">
                <button
                  onClick={() => setCurrentEventPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentEventPage === 1}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                >
                  {i18n.language === "en" ? "Previous" : "Önceki"}
                </button>
                <div className="flex items-center justify-center px-3 sm:px-4 font-medium text-xs sm:text-sm text-gray-800 bg-gray-50 rounded-lg border border-gray-100 py-2">
                  {currentEventPage} / {totalEventPages}
                </div>
                <button
                  onClick={() => setCurrentEventPage((prev) => Math.min(prev + 1, totalEventPages))}
                  disabled={currentEventPage === totalEventPages}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-center"
                >
                  {i18n.language === "en" ? "Next" : "Sonraki"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}