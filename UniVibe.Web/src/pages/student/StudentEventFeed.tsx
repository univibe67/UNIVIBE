import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import {
  CalendarDays,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Search,
  PlusCircle,
  Sparkles,
  MapPin,
  Calendar,
  XCircle,
  User,
  Tag,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
  cancellationReason?: string;
  rejectionReason?: string;
}

interface Category {
  id: string;
  name: string;
}

interface PaginatedResponse<T> {
  items?: T[];
  data?: {
    items?: T[];
  } | T[];
}

export default function StudentEventFeed() {
  const { t } = useTranslation();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [hasActiveEvent, setHasActiveEvent] = useState(false);
  const [myActiveEvent, setMyActiveEvent] = useState<EventItem | null>(null);
  const [isMyActiveModalOpen, setIsMyActiveModalOpen] = useState(false);
  const [myActiveLoading, setMyActiveLoading] = useState(false);

  // Etkinlik Detay Modalı State'leri
  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [, setDetailLoading] = useState(false);

  // İptal Etme Modalı State'leri
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [eventToCancelId, setEventToCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Etkinlik Oluşturma State'leri
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchEventsAndCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<EventItem>>("/Events/all-events", {
        params: { PageNumber: 1, PageSize: 50, OnlyActive: true },
      });
      const responseData = response.data || response;
      const data = (responseData as any)?.items || (responseData as any)?.data?.items || (responseData as any)?.data || responseData;
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Etkinlikler yüklenirken hata oluştu:", error);
    }

    try {
      const catResponse = await api.get("/EventCategories/event-categories");
      const rawData = catResponse.data || catResponse;
      const catData = (rawData as any)?.data || (rawData as any)?.items || rawData;
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (catError) {
      console.error("Kategoriler yüklenirken hata oluştu:", catError);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyActiveEvent = async () => {
    setMyActiveLoading(true);
    try {
      const response = await api.get("/Events/my-active-event");
      const data = response.data?.data || response.data || response;

      if (!data || !data.id) {
        setMyActiveEvent(null);
        setHasActiveEvent(false);
      } else {
        setMyActiveEvent(data);
        setHasActiveEvent(true);
      }
    } catch {
      setMyActiveEvent(null);
      setHasActiveEvent(false);
    } finally {
      setMyActiveLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndCategories();
    fetchMyActiveEvent();
  }, []);

  const handleOpenMyActiveModal = () => {
    fetchMyActiveEvent();
    setIsMyActiveModalOpen(true);
  };

  const handleOpenCancelModal = (id: string) => {
    setEventToCancelId(id);
    setCancelReason("");
    setCancelError("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || !cancelReason.trim()) {
      setCancelError(t("Admin_Reason_Required") || "Lütfen bir iptal nedeni giriniz.");
      return;
    }

    setIsCancelling(true);
    try {
      await api.post(`/Events/cancel-event/${eventToCancelId}`, JSON.stringify(cancelReason), {
        headers: { "Content-Type": "application/json" },
      });

      setCancelModalOpen(false);
      setIsDetailModalOpen(false);
      setIsMyActiveModalOpen(false);
      setMyActiveEvent(null);
      setHasActiveEvent(false);

      await fetchMyActiveEvent();
      await fetchEventsAndCategories();
      showNotification("success", t("Student_CancelSuccess") || "Etkinlik başarıyla iptal edildi.");
    } catch (error: any) {
      setCancelError(error?.response?.data?.message || t("Student_CancelError") || "İptal işlemi başarısız.");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenDetail = async (eventItem: EventItem) => {
    setDetailLoading(true);
    setSelectedEventDetail(eventItem);
    setIsDetailModalOpen(true);
    try {
      const response: any = await api.get(`/Events/${eventItem.id}`);
      const fetchedData = response.data?.data || response.data || response;
      setSelectedEventDetail(fetchedData);
    } catch (error) {
      console.error("Detay yüklenemedi:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await api.post(`/Events/join/${eventId}`);
      showNotification("success", t("Student_JoinSuccess") || "Etkinliğe başarıyla katıldınız!");
      fetchEventsAndCategories();
      setIsDetailModalOpen(false);
    } catch (error: any) {
      showNotification("error", error?.response?.data?.message || t("Student_JoinError") || "Katılım sırasında bir hata oluştu.");
    }
  };

  const handleOpenCreateModalClick = () => {
    if (hasActiveEvent) {
      showNotification(
        "error",
        t("Student_AlreadyHasPending") || "Zaten aktif veya onay bekleyen bir etkinliğiniz var. En fazla 1 adet etkinlik oluşturabilirsiniz!"
      );
      return;
    }
    setTitle("");
    setDescription("");
    setEventDate("");
    setLocation("");
    setCategoryId("");
    setImageFile(null);
    setCreateError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");

    if (hasActiveEvent) {
      showNotification("error", t("Student_AlreadyHasPending") || "Zaten aktif veya onay bekleyen 1 adet etkinliğiniz var. Yeni etkinlik oluşturamazsınız!");
      setIsCreateModalOpen(false);
      return;
    }

    if (!categoryId) {
      setCreateError(t("Student_SelectCategoryError") || "Lütfen bir kategori seçiniz.");
      return;
    }

    setIsCreating(true);

    try {
      const utcEventDate = eventDate ? new Date(eventDate).toISOString() : "";
      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Description", description);
      formData.append("EventDate", utcEventDate);
      formData.append("Location", location);
      formData.append("CategoryId", categoryId);
      if (imageFile) formData.append("ImageFile", imageFile);

      await api.post("/Events/create-event", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setTitle(""); setDescription(""); setEventDate(""); setLocation(""); setCategoryId(""); setImageFile(null);
      setIsCreateModalOpen(false);
      await fetchMyActiveEvent();
      await fetchEventsAndCategories();
      showNotification("success", t("Student_CreateSuccess") || "Etkinlik başarıyla oluşturuldu ve onaya gönderildi!");
    } catch (error: any) {
      const errorData = error?.response?.data;
      setCreateError(errorData?.message || t("Student_AlreadyHasPending") || "Zaten aktif veya onay bekleyen bir etkinliğiniz var.");
    } finally {
      setIsCreating(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const term = searchTerm.toLowerCase();
    return ev.title?.toLowerCase().includes(term) || ev.creatorName?.toLowerCase().includes(term) || ev.organizerName?.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-pink-50/40 py-8 px-4 sm:px-6 lg:px-8 space-y-6 relative">
      {notification && (
        <div className={`max-w-7xl mx-auto p-4 rounded-2xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all animate-fadeIn ${notification.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 rounded-lg hover:bg-black/10 transition-colors"><X size={16} /></button>
        </div>
      )}

      {/* Header Alanı */}
      <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-purple-100 shadow-xl shadow-purple-500/5 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>UniVibe Social Hub</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t("Student_Events_Title") || "Kampüs Etkinlikleri"}</h1>
            <p className="text-sm text-gray-500">{t("Student_Events_Subtitle") || "Üniversitedeki tüm etkinlikleri keşfet, katıl veya kendi etkinliğini oluştur."}</p>
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex items-center gap-3 flex-wrap pt-2">
          {hasActiveEvent && (
            <button type="button" onClick={handleOpenMyActiveModal} className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-bold px-4 py-3 rounded-2xl transition-all border border-purple-200 text-sm shadow-sm">
              <Clock size={18} />
              <span>{myActiveEvent?.status === 0 || String(myActiveEvent?.status).toLowerCase() === "pending" ? (t("Student_MyPendingEvent") || "Onay Bekleyen Etkinliğim") : (t("Student_MyActiveEvent") || "Aktif Etkinliğim")}</span>
            </button>
          )}
          <button type="button" onClick={handleOpenCreateModalClick} className={`flex items-center gap-2 font-bold px-5 py-3 rounded-2xl transition-all shadow-lg text-sm ${hasActiveEvent ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none" : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-indigo-600/30"}`}>
            <PlusCircle size={18} />
            <span>{t("Student_CreateEvent") || "Etkinlik Oluştur"}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t("Student_SearchPlaceholder") || "Etkinlik veya organizatör ara..."} className="w-full pl-11 pr-4 py-3 bg-white/90 border border-purple-100 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm" />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-purple-600 font-semibold text-lg">{t("Student_Loading") || "Yükleniyor..."}</div>
      ) : filteredEvents.length === 0 ? (
        <div className="max-w-7xl mx-auto text-center py-20 bg-white/80 rounded-3xl border border-dashed border-purple-200">
          <CalendarDays className="mx-auto h-12 w-12 text-purple-400 mb-3" />
          <p className="text-base text-gray-600 font-semibold">{t("Student_NoEventsFound") || "Hiç etkinlik bulunamadı."}</p>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} onViewDetail={handleOpenDetail} />
          ))}
        </div>
      )}

      {/* Etkinlik Detay Modalı */}
      {isDetailModalOpen && selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-purple-100">
            <button type="button" onClick={() => setIsDetailModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-gray-900 border-b border-purple-50 pb-4">
              {selectedEventDetail.title}
            </h2>

            {selectedEventDetail.imageUrl ? (
              <div className="relative h-60 bg-gray-100 rounded-3xl overflow-hidden shadow-lg border border-purple-100">
                <img src={selectedEventDetail.imageUrl} alt={selectedEventDetail.title} className="w-full h-full object-cover" />
                <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-purple-700 shadow-md">
                  {selectedEventDetail.categoryName || (t("Student_GeneralCategory") || "Genel")}
                </span>
              </div>
            ) : (
              <div className="w-full h-40 flex items-center justify-center text-gray-400 text-sm font-semibold bg-purple-50 rounded-3xl border border-purple-100">
                {t("Student_NoImage") || "Görsel Bulunmuyor"}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t("Student_FieldDesc") || "Açıklama"}</h4>
              <p className="text-sm text-gray-700 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60 font-medium leading-relaxed">
                {selectedEventDetail.description || (t("Student_NoDescription") || "Açıklama belirtilmemiş.")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                <Calendar size={20} className="text-purple-600 shrink-0" />
                <div>
                  <span className="text-gray-400 block font-semibold">{t("Student_FieldDate") || "Tarih & Saat"}</span>
                  <span className="font-bold text-gray-800">
                    {selectedEventDetail.eventDate ? new Date(selectedEventDetail.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                <MapPin size={20} className="text-pink-600 shrink-0" />
                <div>
                  <span className="text-gray-400 block font-semibold">{t("Student_FieldLocation") || "Konum"}</span>
                  <span className="font-bold text-gray-800 truncate block max-w-[180px]">{selectedEventDetail.location || (t("Student_NoLocation") || "Konum belirtilmemiş")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                <User size={20} className="text-blue-600 shrink-0" />
                <div>
                  <span className="text-gray-400 block font-semibold">{t("Student_Organizer") || "Düzenleyen"}</span>
                  <span className="font-bold text-gray-800 truncate block max-w-[180px]">{selectedEventDetail.creatorName || selectedEventDetail.organizerName || (t("Student_Unknown") || "Bilinmiyor")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                <Tag size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <span className="text-gray-400 block font-semibold">{t("Student_FieldCategory") || "Kategori"}</span>
                  <span className="font-bold text-gray-800 truncate block max-w-[180px]">{selectedEventDetail.categoryName || (t("Student_GeneralCategory") || "Genel")}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              {selectedEventDetail.isCreator ? (
                <button type="button" onClick={() => { setIsDetailModalOpen(false); handleOpenCancelModal(selectedEventDetail.id); }} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-red-600/20">
                  {t("Student_CancelEventBtn") || "Etkinliği İptal Et"}
                </button>
              ) : selectedEventDetail.isJoined ? (
                <button type="button" disabled className="w-full bg-emerald-50 text-emerald-700 font-bold py-3.5 rounded-2xl text-sm border border-emerald-200 flex items-center justify-center gap-2 cursor-not-allowed">
                  <CheckCircle size={18} className="text-emerald-600" />
                  <span>{t("Student_AlreadyJoined") || "Etkinliğe Katıldınız"}</span>
                </button>
              ) : (
                <button type="button" onClick={() => handleJoinEvent(selectedEventDetail.id)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-emerald-600/20">
                  {t("Student_JoinEventBtn") || "Etkinliğe Katıl"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aktif / Onay Bekleyen Etkinliğim Modalı */}
      {isMyActiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto border border-purple-100">
            <button type="button" onClick={() => setIsMyActiveModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 border-b border-purple-50 pb-4">
              <div className="p-3.5 bg-purple-100 text-purple-700 rounded-2xl">
                <Clock size={26} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900">{t("Student_ActiveOrPendingModalTitle") || "Aktif / Onay Bekleyen Etkinliğim"}</h2>
                <p className="text-xs text-gray-500 font-medium">{t("Student_ActiveOrPendingModalSubtitle") || "Oluşturduğunuz etkinliğin detayları"}</p>
              </div>
            </div>

            {myActiveLoading ? (
              <div className="py-16 text-center text-purple-600 font-bold">{t("Student_Loading") || "Yükleniyor..."}</div>
            ) : !myActiveEvent ? (
              <div className="text-center py-16 bg-purple-50/40 rounded-3xl border border-dashed border-purple-200 space-y-3">
                <CalendarDays className="mx-auto h-12 w-12 text-purple-400" />
                <p className="text-sm text-gray-600 font-semibold">{t("Student_NoActiveOrPendingEvent") || "Aktif veya onay bekleyen bir etkinliğiniz bulunmuyor."}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative h-60 bg-gray-100 rounded-3xl overflow-hidden shadow-lg border border-purple-100">
                  {myActiveEvent.imageUrl ? (
                    <img src={myActiveEvent.imageUrl} alt={myActiveEvent.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-semibold bg-purple-50">{t("Student_NoImage") || "Görsel Bulunmuyor"}</div>
                  )}
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black text-purple-700 shadow-md">
                    {myActiveEvent.categoryName || (t("Student_GeneralCategory") || "Genel")}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="font-black text-gray-900 text-2xl">{myActiveEvent.title}</h3>
                    <span className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                      <Clock size={14} />
                      <span>{myActiveEvent.status === 0 || String(myActiveEvent.status).toLowerCase() === "pending" ? (t("Student_StatusPending") || "Admin Onayı Bekliyor") : (t("Student_StatusApproved") || "Onaylandı & Aktif")}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60 font-medium">
                    {myActiveEvent.description || (t("Student_NoDescription") || "Açıklama belirtilmemiş.")}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                    <Calendar size={20} className="text-purple-600 shrink-0" />
                    <div>
                      <span className="text-gray-400 block font-semibold">{t("Student_FieldDate") || "Tarih & Saat"}</span>
                      <span className="font-bold text-gray-800">
                        {new Date(myActiveEvent.eventDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 bg-purple-50/40 p-4 rounded-2xl border border-purple-100/60">
                    <MapPin size={20} className="text-pink-600 shrink-0" />
                    <div>
                      <span className="text-gray-400 block font-semibold">{t("Student_FieldLocation") || "Konum"}</span>
                      <span className="font-bold text-gray-800 truncate block max-w-[180px]">{myActiveEvent.location || (t("Student_NoLocation") || "Konum belirtilmemiş")}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => { setIsMyActiveModalOpen(false); handleOpenCancelModal(myActiveEvent.id); }} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl transition-colors text-sm border border-red-200 flex items-center justify-center gap-2 shadow-sm">
                    <XCircle size={18} />
                    <span>{t("Student_CancelEventBtn") || "Etkinliği İptal Et"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* İptal Onay Modalı */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-4 shadow-2xl relative border border-purple-100">
            <h3 className="text-xl font-black text-gray-900">{t("Student_CancelModalTitle") || "Etkinliği İptal Et"}</h3>
            <p className="text-xs text-gray-500 font-medium">{t("Student_CancelModalDesc") || "Lütfen bu etkinliği neden iptal ettiğinizi belirtin."}</p>
            <textarea value={cancelReason} onChange={(e) => { setCancelReason(e.target.value); if (cancelError) setCancelError(""); }} placeholder={t("Student_CancelReasonPlaceholder") || "İptal nedeni..."} className="w-full p-4 border border-purple-100 rounded-2xl outline-none text-sm h-32 resize-none bg-purple-50/40 focus:border-purple-500 font-medium" />
            {cancelError && <p className="text-xs text-red-600 font-bold">{cancelError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCancelModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-sm transition-colors">{t("Student_CancelBtn") || "Vazgeç"}</button>
              <button type="button" onClick={handleConfirmCancel} disabled={isCancelling} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50">{isCancelling ? (t("Student_Cancelling") || "İptal Ediliyor...") : (t("Student_ConfirmCancel") || "İptali Onayla")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Etkinlik Oluşturma Modalı */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-5 shadow-2xl relative my-8 border border-purple-100">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 border-b border-purple-50 pb-4">{t("Student_ModalTitleCreate") || "Yeni Etkinlik Oluştur"}</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldTitle") || "Etkinlik Başlığı"}</label>
                <input type="text" required value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder={t("Student_PlaceholderTitle") || "Örn: Yazılım Kampı Buluşması"} className="w-full p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{t("Student_FieldDate") || "Tarih & Saat"}</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="datetime-local" 
                      required 
                      value={eventDate} 
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEventDate(e.target.value)} 
                      className="w-full p-3.5 bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-pink-50/50 border-2 border-purple-200/90 rounded-2xl text-sm font-bold text-purple-900 outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-500/15 transition-all shadow-sm cursor-pointer hover:border-purple-300" 
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldCategory") || "Kategori"}</label>
                  <select required value={categoryId} onChange={(e: ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)} className="w-full p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm font-medium outline-none focus:border-purple-500">
                    <option value="">{t("Student_SelectCategory") || "Kategori Seçin"}</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldLocation") || "Konum"}</label>
                <input type="text" required value={location} onChange={(e: ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} placeholder={t("Student_PlaceholderLocation") || "Örn: Mühendislik Fakültesi Amfi-1"} className="w-full p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldDesc") || "Açıklama"}</label>
                <textarea required rows={3} value={description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} placeholder={t("Student_PlaceholderDesc") || "Etkinlik hakkında detaylı bilgi verin..."} className="w-full p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl text-sm font-medium outline-none focus:border-purple-500 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldImage") || "Etkinlik Görseli"}</label>
                <input type="file" accept="image/*" onChange={(e: ChangeEvent<HTMLInputElement>) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-purple-100 file:text-purple-700 cursor-pointer" />
              </div>
              {createError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl text-sm transition-colors">{t("Student_CancelBtn") || "Vazgeç"}</button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-indigo-600/30 transition-colors disabled:opacity-50">{isCreating ? (t("Student_Creating") || "Oluşturuluyor...") : (t("Student_CreateBtn") || "Oluştur")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}