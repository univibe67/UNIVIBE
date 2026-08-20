import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, PlusCircle, XCircle, AlertTriangle, X } from "lucide-react";
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

  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

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
      const activeRes = await api.get("/Events/my-active-event");
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
      const joinedRes = await api.get("/Events/my-joined-events");
      const joinedData = joinedRes.data?.data || joinedRes.data || joinedRes;
      setJoinedEvents(Array.isArray(joinedData) ? joinedData : []);
    } catch {
      setJoinedEvents([]);
    }

    try {
      const catResponse = await api.get("/EventCategories/event-categories");
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

  const handleOpenCreateModal = () => {
    if (activeEvent) {
      showNotification("error", t("Student_AlreadyHasPending") || "Zaten aktif bir etkinliğiniz var.");
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

      await api.post("/Events/create", formData, {
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
      await api.post(`/Events/cancel-event/${activeEvent.id}`, JSON.stringify(cancelReason), {
        headers: { "Content-Type": "application/json" },
      });
      showNotification("success", t("Student_CancelSuccess") || "Etkinlik iptal edildi.");
      setCancelModalOpen(false);
      fetchData();
    } catch (error: any) {
      setCancelError(error?.response?.data?.message || t("Student_CancelError") || "İptal başarısız oldu.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl text-white font-bold shadow-lg max-w-sm w-full transform transition-all duration-300 translate-y-0 ${notification.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
          <div className="flex items-center gap-3">
            {notification.type === "success" ? <Calendar size={20} /> : <AlertTriangle size={20} />}
            <span className="text-sm">{notification.text}</span>
          </div>
        </div>
      )}

      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[40px] shadow-sm mb-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t("Student_Events_Title") || "Etkinliklerim"}</h1>
          <p className="text-sm text-gray-500 font-medium">{t("Student_Events_Desc") || "Oluşturduğun ve katıldığın etkinlikler"}</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          disabled={!!activeEvent}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlusCircle size={18} />
          <span className="hidden sm:inline">{t("Student_CreateEvent") || "Yeni Etkinlik"}</span>
        </button>
      </div>

      <div className="px-6 space-y-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-40 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium text-sm">Yükleniyor...</p>
          </div>
        ) : (
          <>
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="text-blue-500" size={20} />
                Aktif Etkinliğim
              </h2>
              {activeEvent ? (
                <div className="bg-white rounded-3xl p-5 shadow-sm border border-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
                  <EventCard event={activeEvent} onViewDetail={() => {}} />
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => {
                        setCancelReason("");
                        setCancelError("");
                        setCancelModalOpen(true);
                      }}
                      className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                      <XCircle size={18} />
                      Etkinliği İptal Et
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-3xl p-8 text-center">
                  <p className="text-gray-500 font-medium text-sm">Henüz aktif bir etkinliğiniz bulunmuyor.</p>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="text-indigo-500" size={20} />
                Katıldığım Etkinlikler
              </h2>
              {joinedEvents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {joinedEvents.map((event) => (
                    <EventCard key={event.id} event={event} onViewDetail={() => {}} />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100/50 border border-dashed border-gray-300 rounded-3xl p-8 text-center">
                  <p className="text-gray-500 font-medium text-sm">Henüz bir etkinliğe katılmadınız.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Etkinlik Oluşturma Modalı */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-5 shadow-2xl relative my-8 border border-blue-100">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-5 right-5 p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-black text-gray-900 border-b border-blue-50 pb-4">{t("Student_ModalTitleCreate") || "Yeni Etkinlik Oluştur"}</h2>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldTitle") || "Etkinlik Başlığı"}</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Örn: Yazılım Kampı Buluşması" className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>{t("Student_FieldDate") || "Tarih & Saat"}</span>
                  </label>
                  <input type="datetime-local" required value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-bold text-blue-900 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldCategory") || "Kategori"}</label>
                  <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500">
                    <option value="">Kategori Seçin</option>
                    {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldLocation") || "Konum"}</label>
                <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Örn: Mühendislik Fakültesi Amfi-1" className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldDesc") || "Açıklama"}</label>
                <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Etkinlik hakkında detaylı bilgi verin..." className="w-full p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t("Student_FieldImage") || "Etkinlik Görseli"}</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-5 file:rounded-2xl file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-700 cursor-pointer" />
              </div>
              {createError && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 rounded-2xl text-sm transition-colors">Vazgeç</button>
                <button type="submit" disabled={isCreating} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50">{isCreating ? "Oluşturuluyor..." : "Oluştur"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* İptal Onay Modalı */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-4 shadow-2xl relative border border-blue-100">
            <h3 className="text-xl font-black text-gray-900">Etkinliği İptal Et</h3>
            <p className="text-xs text-gray-500 font-medium">Lütfen bu etkinliği neden iptal ettiğinizi belirtin.</p>
            <textarea value={cancelReason} onChange={(e) => { setCancelReason(e.target.value); if (cancelError) setCancelError(""); }} placeholder="İptal nedeni..." className="w-full p-4 border border-blue-100 rounded-2xl outline-none text-sm h-32 resize-none bg-blue-50/40 focus:border-blue-500 font-medium" />
            {cancelError && <p className="text-xs text-red-600 font-bold">{cancelError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCancelModalOpen(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-sm transition-colors">Vazgeç</button>
              <button type="button" onClick={handleConfirmCancel} disabled={isCancelling} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50">{isCancelling ? "İptal Ediliyor..." : "İptali Onayla"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}