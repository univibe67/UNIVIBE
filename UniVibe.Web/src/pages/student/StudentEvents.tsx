import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  PlusCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../services/api";
import EventCard from "../../components/EventCard";

interface EventItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  creatorName?: string;
  organizerName?: string;
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
  const { t } = useTranslation();
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

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const activeRes = await api.get("/events/active/me");
      const activeData = activeRes.data?.data || activeRes.data || activeRes;
      if (activeData && activeData.id) {
        setActiveEvent(activeData);
      } else {
        setActiveEvent(null);
      }
    } catch {
      setActiveEvent(null);
    }

    try {
      const joinedRes = await api.get("/events/joined/me");
      const joinedData = joinedRes.data?.data || joinedRes.data || joinedRes;
      setJoinedEvents(Array.isArray(joinedData) ? joinedData : []);
    } catch {
      setJoinedEvents([]);
    }

    try {
      const catResponse = await api.get("/event-categories");
      const rawData = catResponse.data || catResponse;
      const catData = (rawData as any)?.data || (rawData as any)?.items || rawData;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (catError) {
      console.error("Kategoriler yüklenirken hata oluştu:", catError);
    }

    setLoading(false);
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
      setCreateError("Minimum sınıf, maksimum sınıftan büyük olamaz.");
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
      setCreateError(error?.response?.data?.message || t("Student_CreateError") || "Etkinlik oluşturulamadı.");
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
      setCancelError(error?.response?.data?.message || t("Student_CancelError") || "İptal başarısız oldu.");
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
            <p>Etkinliklerin yükleniyor...</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="student-events-section-title">
                <Calendar className="text-blue-500" size={20} />
                Aktif Etkinliğim
              </h2>
              {activeEvent ? (
                <div className="student-event-panel">
                  <EventCard
                    event={activeEvent}
                    onViewDetail={() => navigate(`/student/events/${activeEvent.id}`)}
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
                      Etkinliği İptal Et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="student-events-empty">
                  <p>Henüz aktif bir etkinliğiniz bulunmuyor.</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="student-events-section-title">
                <Calendar className="text-indigo-500" size={20} />
                Katıldığım Etkinlikler
              </h2>
              {joinedEvents.length > 0 ? (
                <div className="student-events-list">
                  {joinedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onViewDetail={() => navigate(`/student/events/${event.id}`)}
                    />
                  ))}
                </div>
              ) : (
                <div className="student-events-empty">
                  <p>Henüz bir etkinliğe katılmadınız.</p>
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
                <label><span>{t("Student_Date")}</span><input type="date" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></label>
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
                  <option value="0">{t("Grade_Prep")}</option><option value="1">{t("Grade_1")}</option><option value="2">{t("Grade_2")}</option><option value="3">{t("Grade_3")}</option><option value="4">{t("Grade_4")}</option><option value="7">{t("Grade_Graduated")}</option>
                </select>
                </label>
                <label><span>{t("Student_MaximumGrade")}</span>
                <select value={maxGrade} onChange={(e) => setMaxGrade(e.target.value)}>
                  <option value="">{t("Student_NoRestriction")}</option>
                  <option value="0">{t("Grade_Prep")}</option><option value="1">{t("Grade_1")}</option><option value="2">{t("Grade_2")}</option><option value="3">{t("Grade_3")}</option><option value="4">{t("Grade_4")}</option><option value="7">{t("Grade_Graduated")}</option>
                </select>
                </label>
                <label><span>{t("Student_FieldImage")} ({t("Student_Optional")})</span><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></label>
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
    </div>
  );
}