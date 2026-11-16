import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  PlusCircle,
  XCircle,
  AlertTriangle,
  MessageCircle,
  X,
  LogOut,
  Loader2,
  MapPin,
  User,
  Tag,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../services/api";
import { getErrorMessage } from "../../services/errorMessage";
import EventCard from "../../components/EventCard";
import EventCommentsChat from "../../components/EventCommentsChat";
import { isEventInFuture } from "../../utils/eventFilter";
import { formatCategoryName } from "../../utils/categoryLabel";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  creatorName?: string;
  organizerName?: string;
  creatorId?: string;
  userId?: string;
  eventDate: string;
  status: string | number;
  categoryName?: string;
  isCreator?: boolean;
  isJoined?: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function StudentEvents() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [minGrade, setMinGrade] = useState("");
  const [maxGrade, setMaxGrade] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Cancel Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Detail Modal states
  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isLeavingEvent, setIsLeavingEvent] = useState(false);

  // Comments Modal states
  const [selectedCommentsEvent, setSelectedCommentsEvent] = useState<EventItem | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);

  const handleOpenDetail = async (eventItem: EventItem) => {
    setDetailLoading(true);
    setSelectedEventDetail(eventItem);
    setIsDetailModalOpen(true);
    try {
      const response: any = await api.get(`/events/${eventItem.id}`);
      const fetchedData = response?.data?.data || response?.data || response;
      if (fetchedData && fetchedData.id) {
        setSelectedEventDetail({
          ...fetchedData,
          isJoined: eventItem.isJoined !== undefined ? eventItem.isJoined : fetchedData.isJoined,
          isCreator: eventItem.isCreator !== undefined ? eventItem.isCreator : fetchedData.isCreator,
        });
      }
    } catch (error) {
      console.error("Detay yüklenemedi:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenComments = async (eventItem: EventItem) => {
    setSelectedCommentsEvent(eventItem);
    setIsCommentsModalOpen(true);
    try {
      const response: any = await api.get(`/events/${eventItem.id}`);
      const actualData = response?.data?.data || response?.data || response;
      if (actualData) {
        setSelectedCommentsEvent({
          ...actualData,
          isJoined: actualData.isJoined !== undefined ? actualData.isJoined : eventItem.isJoined,
          isCreator: actualData.isCreator !== undefined ? actualData.isCreator : eventItem.isCreator,
        });
      }
    } catch {
      // ignore
    }
  };

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const handleLeaveEvent = async (eventId: string) => {
    setIsLeavingEvent(true);
    try {
      await api.delete(`/events/${eventId}/attendees/me`);
      showNotification("success", t("Student_LeaveSuccess") || "Etkinlikten başarıyla ayrıldınız.");
      setJoinedEvents((prev) => prev.filter((e) => e.id !== eventId));
      setIsDetailModalOpen(false);
      setSelectedEventDetail(null);
      setSelectedCommentsEvent((prev) => (prev && prev.id === eventId ? { ...prev, isJoined: false } : prev));
      await fetchData();
    } catch (err: any) {
      showNotification("error", getErrorMessage(err) || t("Student_LeaveError") || "Etkinlikten ayrılırken bir sorun oluştu.");
    } finally {
      setIsLeavingEvent(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activeResult, joinedResult, catResult] = await Promise.allSettled([
        api.get("/events/active/me"),
        api.get("/events/joined/me"),
        api.get("/event-categories"),
      ]);

      if (activeResult.status === "fulfilled") {
        const activeRes = activeResult.value;
        const activeData = activeRes.data?.data || activeRes.data || activeRes;
        if (activeData && activeData.id) {
          setActiveEvent(activeData);
        } else {
          setActiveEvent(null);
        }
      } else {
        setActiveEvent(null);
      }

      if (joinedResult.status === "fulfilled") {
        const joinedRes = joinedResult.value;
        const joinedData = joinedRes.data?.data || joinedRes.data || joinedRes;
        setJoinedEvents(Array.isArray(joinedData) ? joinedData : []);
      } else {
        setJoinedEvents([]);
      }

      if (catResult.status === "fulfilled") {
        const catResponse = catResult.value;
        const rawData = catResponse.data || catResponse;
        const catData = (rawData as any)?.data || (rawData as any)?.items || rawData;
        setCategories(Array.isArray(catData) ? catData : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    if (activeEvent) {
      showNotification("error", t("Student_AlreadyHasPending") || "Zaten aktif bir etkinliğiniz var.");
      return;
    }
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setCategoryId("");
    setMinGrade("");
    setMaxGrade("");
    setImageFile(null);
    setCreateError("");
    setIsCreateModalOpen(true);
  }, [activeEvent, t]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (!categoryId) {
      setCreateError(t("Student_SelectCategoryError") || "Lütfen bir kategori seçiniz.");
      return;
    }

    if (minGrade && maxGrade && Number(minGrade) > Number(maxGrade)) {
      setCreateError(t("Student_GradeRangeError"));
      return;
    }

    setIsCreating(true);
    try {
      const localEventDate = eventDate && eventTime ? `${eventDate}T${eventTime}` : "";
      const utcEventDate = localEventDate ? new Date(localEventDate).toISOString() : "";
      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Description", description);
      formData.append("EventDate", utcEventDate);
      formData.append("Location", location);
      formData.append("CategoryId", categoryId);
      if (minGrade) formData.append("MinGrade", minGrade);
      if (maxGrade) formData.append("MaxGrade", maxGrade);
      if (imageFile) formData.append("ImageFile", imageFile);

      await api.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showNotification("success", t("Student_CreateSuccess") || "Etkinlik başarıyla oluşturuldu.");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (error: any) {
      setCreateError(getErrorMessage(error) || t("Student_CreateError") || "Etkinlik oluşturulamadı.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!activeEvent) return;
    if (!cancelReason || !cancelReason.trim()) {
      setCancelError(t("Admin_Reason_Required") || "Lütfen iptal nedeni girin.");
      return;
    }

    setIsCancelling(true);
    try {
      await api.patch(`/events/${activeEvent.id}/cancel`, {
        reason: cancelReason,
      });
      showNotification("success", t("Student_CancelSuccess") || "Etkinlik iptal edildi.");
      setCancelModalOpen(false);
      setTimeout(() => {
        navigate("/student/home");
      }, 700);
    } catch (error: any) {
      setCancelError(getErrorMessage(error) || t("Student_CancelError") || "İptal başarısız oldu.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="student-events-page">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-bold shadow-lg max-w-sm w-full transform transition-all duration-300 translate-y-0 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? <Calendar size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm">{notification.text}</span>
          </div>
        </div>
      )}

      <div className="student-events-brand">
        <div className="brand-lockup">
          <span className="brand-mark">U</span>
          <span>Uni<strong>Vibe</strong></span>
        </div>
      </div>

      <header className="student-events-header">
        <div>
          <h1>{t("Student_Events_Title", { defaultValue: "Kampüs Etkinlikleri" })}</h1>
          <p>{t("Student_Events_Desc", { defaultValue: "Oluşturduğun ve katıldığın etkinlikler" })}</p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="student-events-create-button"
        >
          <PlusCircle size={18} />
          <span>{t("Student_CreateEvent", { defaultValue: "Etkinlik oluştur" })}</span>
        </button>
      </header>

      <main className="student-events-content">
        {loading ? (
          <div className="student-events-loading">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p>{t("Student_LoadingEvents")}</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="student-events-section-title">
                <Calendar className="text-blue-500" size={20} />
                {t("Student_MyActiveEvent")}
              </h2>
              {activeEvent ? (
                <div className="student-event-panel">
                  <EventCard
                    event={{ ...activeEvent, isCreator: true }}
                    onViewDetail={() => handleOpenDetail({ ...activeEvent, isCreator: true })}
                    onOpenComments={() => handleOpenComments({ ...activeEvent, isCreator: true })}
                  />
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCancelReason("");
                        setCancelError("");
                        setCancelModalOpen(true);
                      }}
                      className="student-event-cancel"
                    >
                      <XCircle size={18} />
                      {t("Student_CancelEventBtn")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="student-events-empty">
                  <p>{t("Student_NoActiveEvent")}</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="student-events-section-title">
                <Calendar className="text-indigo-500" size={20} />
                {t("Student_JoinedEvents")}
              </h2>
              {(joinedEvents?.length ?? 0) > 0 ? (
                <div className="student-events-list">
                  {joinedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={{ ...event, isJoined: true }}
                      onViewDetail={() => handleOpenDetail({ ...event, isJoined: true })}
                      onOpenComments={() => handleOpenComments({ ...event, isJoined: true })}
                    />
                  ))}
                </div>
              ) : (
                <div className="student-events-empty">
                  <p>{t("Student_NoJoinedEvents")}</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Etkinlik Oluşturma Modalı */}
      {isCreateModalOpen && (
        <div className="create-event-page">
          <div className="create-event-sheet">
            <div className="create-event-header">
              <div className="student-topbar">
                <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
              </div>
              <div className="auth-eyebrow">{t("Student_NewEventEyebrow")}</div>
              <h2>{t("Student_NewEventTitle")}</h2>
              <p>{t("Student_NewEventDescription")}</p>
            </div>
            <form onSubmit={handleCreateEvent} className="create-event-form">
              <section className="create-event-section">
                <div className="create-event-section-heading">
                <strong>01</strong>
                <div><h3>{t("Student_BasicInfo")}</h3><p>{t("Student_BasicInfoDescription")}</p></div>
                </div>
                <label>
                <span>{t("Student_FieldTitle") || "Etkinlik başlığı"}</span>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("Student_PlaceholderTitle")}
                />
                </label>
                <label>
                <span>{t("Student_FieldDesc") || "Açıklama"}</span>
                <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("Student_PlaceholderDesc")} />
                </label>
                <label>
                <span>{t("Student_FieldCategory") || "Kategori"}</span>
                <select
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">{t("Student_SelectCategory") || "Kategori seçin"}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                </label>
              </section>
              <section className="create-event-section">
                <div className="create-event-section-heading">
                <strong>02</strong>
                <div><h3>{t("Student_TimeAndLocation")}</h3><p>{t("Student_TimeAndLocationDescription")}</p></div>
                </div>
                <div className="create-event-grid">
                <label>
                  <span>{t("Student_Date")}</span>
                  <input
                    type="date"
                    lang={i18n.language === "en" ? "en-US" : "tr-TR"}
                    aria-label={t("Student_Date")}
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </label>
                <label><span>{t("Student_Time")}</span><input type="time" required value={eventTime} onChange={(e) => setEventTime(e.target.value)} /></label>
                </div>
                <label><span>{t("Student_FieldLocation")}</span><input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t("Student_LocationPlaceholder")} /></label>
              </section>
              <section className="create-event-section">
                <div className="create-event-section-heading">
                <strong>03</strong>
                <div><h3>{t("Student_AttendanceDetails")}</h3><p>{t("Student_AttendanceDetailsDescription")}</p></div>
                </div>
                <label><span>{t("Student_MinimumGrade")}</span>
                <select value={minGrade} onChange={(e) => setMinGrade(e.target.value)}>
                  <option value="">{t("Student_NoRestriction")}</option>
                  <option value="0">{t("Grade_Prep")}</option><option value="1">{t("Grade_1")}</option><option value="2">{t("Grade_2")}</option><option value="3">{t("Grade_3")}</option><option value="4">{t("Grade_4")}</option><option value="5">{t("Grade_5")}</option><option value="6">{t("Grade_6")}</option><option value="7">{t("Grade_Graduated")}</option>
                </select>
                </label>
                <label><span>{t("Student_MaximumGrade")}</span>
                <select value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)}>
                  <option value="">{t("Student_NoRestriction")}</option>
                  <option value="0">{t("Grade_Prep")}</option><option value="1">{t("Grade_1")}</option><option value="2">{t("Grade_2")}</option><option value="3">{t("Grade_3")}</option><option value="4">{t("Grade_4")}</option><option value="5">{t("Grade_5")}</option><option value="6">{t("Grade_6")}</option><option value="7">{t("Grade_Graduated")}</option>
                </select>
                </label>
                <label>
                  <span>{t("Student_FieldImage")} ({t("Student_Optional")})</span>
                  <span className="create-event-file-picker">
                    <input
                      className="create-event-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <span className="create-event-file-button">{t("Student_ChooseFile")}</span>
                    <span className="create-event-file-name">
                      {imageFile?.name || t("Student_NoFileSelected")}
                    </span>
                  </span>
                </label>
              </section>
              {createError && (
                <div className="auth-error flex items-center gap-2">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{createError}</span>
                </div>
              )}
              <div className="create-event-actions">
                <button
                type="button"
                onClick={() => navigate("/student/home")}
                className="create-event-cancel"
                >
                {t("Student_CancelBtn") || "Vazgeç"}
                </button>
                <p>{t("Student_PublishNotice")}</p>
                <button
                type="submit"
                disabled={isCreating}
                className="create-event-submit"
                >
                {isCreating ? t("Student_Creating") : `${t("Student_PublishEvent")} ›`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* İptal Onay Modalı */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-4 shadow-2xl relative border border-blue-100">
            <h3 className="text-xl font-black text-gray-900">{t("Student_CancelModalTitle")}</h3>
            <p className="text-xs text-gray-500 font-medium">
              {t("Student_CancelModalDescription")}
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError("");
              }}
              placeholder={t("Student_CancelReasonPlaceholder")}
              className="w-full p-4 border border-blue-100 rounded-2xl outline-none text-sm h-32 resize-none bg-blue-50/40 focus:border-blue-500 font-medium"
            />
            {cancelError && <p className="text-xs text-red-600 font-bold">{cancelError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-sm transition-colors"
              >
                {t("Student_CancelBtn")}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isCancelling ? t("Student_Cancelling") : t("Student_ConfirmCancel")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Etkinlik Detay Modalı */}
      {isDetailModalOpen && selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => {
                setIsDetailModalOpen(false);
                setSelectedEventDetail(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-md hover:bg-gray-100 text-gray-700 transition-colors z-10 shadow-sm"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={20} />
            </button>

            {detailLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-2" />
                <span className="text-xs font-semibold">{t("Admin_LoadingDetails")}</span>
              </div>
            ) : (
              <>
                <div className="relative h-48 -mx-6 -mt-6 mb-6">
                  {selectedEventDetail.imageUrl ? (
                    <img src={selectedEventDetail.imageUrl} alt={selectedEventDetail.title} className="w-full h-full object-cover rounded-t-3xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center rounded-t-3xl">
                      <Calendar size={48} className="text-blue-300 mb-2" />
                      <span className="text-blue-400 font-bold text-sm">{t("Student_EventPlaceholder")}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h2 className="text-2xl font-black text-white">{selectedEventDetail.title}</h2>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Calendar size={18} className="text-blue-500" />
                    <span className="text-sm font-semibold">
                      {selectedEventDetail.eventDate ? new Date(selectedEventDetail.eventDate).toLocaleString(i18n.language === "en" ? "en-US" : "tr-TR", { dateStyle: "long", timeStyle: "short" }) : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <MapPin size={18} className="text-red-500" />
                    <span className="text-sm font-semibold">{selectedEventDetail.location || t("Student_NotSpecified")}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <User size={16} className="text-purple-500" />
                      <span className="text-xs font-semibold truncate">{selectedEventDetail.creatorName || selectedEventDetail.organizerName || t("Student_Unknown")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Tag size={16} className="text-green-500" />
                      <span className="text-xs font-semibold truncate">{formatCategoryName(selectedEventDetail.categoryName, t)}</span>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {selectedEventDetail.description || t("Student_NoEventDescription")}
                    </p>
                  </div>
                  
                  {selectedEventDetail.isJoined && (
                    <div className="space-y-2">
                      <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2">
                        <CheckCircle2 size={18} />
                        <span>{t("Student_JoinedBadge") || "✓ Katıldınız"}</span>
                      </div>
                      {isEventInFuture(selectedEventDetail.eventDate) && (
                        <button
                          type="button"
                          onClick={() => handleLeaveEvent(selectedEventDetail.id)}
                          disabled={isLeavingEvent}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLeavingEvent ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>{t("Student_Leaving") || "Ayrılınıyor..."}</span>
                            </>
                          ) : (
                            <>
                              <LogOut size={14} />
                              <span>{t("Student_LeaveEventBtn") || "Etkinlikten Ayrıl"}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                  {selectedEventDetail.isCreator && (
                    <div className="w-full bg-gray-100 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl text-sm text-center">
                      {t("Student_CreatedByYou") || "Sizin Etkinliğiniz"}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Yorumlar & Sohbet Modalı */}
      {isCommentsModalOpen && selectedCommentsEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col p-6 shadow-2xl relative border border-gray-100">
            {/* Modal Kapatma Butonu */}
            <button
              onClick={() => {
                setIsCommentsModalOpen(false);
                setSelectedCommentsEvent(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors z-10"
              aria-label={t("Admin_Close") || "Kapat"}
            >
              <X size={18} />
            </button>

            {/* Modal Başlığı */}
            <div className="border-b border-gray-100 pb-4 pr-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <MessageCircle size={20} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate leading-snug">
                    {selectedCommentsEvent.title}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium truncate">
                    {t("Event_CommentsModalSubtitle") || "Etkinlik Yorumları & Canlı Sohbet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Sohbet Bileşeni */}
            <div className="overflow-y-auto flex-1">
              <EventCommentsChat
                eventId={selectedCommentsEvent.id}
                isJoined={selectedCommentsEvent.isJoined}
                isCreator={selectedCommentsEvent.isCreator}
                creatorId={(selectedCommentsEvent as any).creatorId ?? (selectedCommentsEvent as any).userId}
                creatorName={selectedCommentsEvent.creatorName || selectedCommentsEvent.organizerName}
                organizerName={selectedCommentsEvent.organizerName || selectedCommentsEvent.creatorName}
                className="!mt-0 !pt-2 !border-t-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}