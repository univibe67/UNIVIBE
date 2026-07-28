import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Search, MapPin, Calendar, User, Tag, Sparkles } from "lucide-react";
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
}

interface PaginatedResponse<T> {
  items?: T[];
  data?: {
    items?: T[];
  } | T[];
}

export default function StudentHome() {
  const { t } = useTranslation();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // Removed unused categories and notification state

  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const showNotification = (_type: "success" | "error", _text: string) => {
    setTimeout(() => {
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
      await api.get("/EventCategories/event-categories");
      // Categories fetched but not currently used in this component's view
    } catch (catError) {
      console.error("Kategoriler yüklenirken hata oluştu:", catError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsAndCategories();
  }, []);

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

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Üst Alan */}
      <div className="bg-white px-6 pt-10 pb-6 rounded-b-[40px] shadow-sm mb-6 border-b border-gray-100 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            {t("Student_Events_Title") || "Keşfet"}
            <Sparkles className="text-blue-500" size={24} />
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {t("Student_Events_Desc") || "Kampüsteki en yeni etkinliklere katıl"}
          </p>
        </div>
      </div>

      <div className="px-6 space-y-6 max-w-7xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={t("Student_SearchPlaceholder") || "Etkinlik ara..."}
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all shadow-sm font-medium"
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">{t("Admin_Loading") || "Etkinlikler Yükleniyor..."}</p>
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetail={() => handleOpenDetail(event)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-medium text-center">{t("Student_NoEvents") || "Şu an ufukta etkinlik görünmüyor."}</p>
          </div>
        )}
      </div>

      {/* Etkinlik Detay Modalı */}
      {isDetailModalOpen && selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative border border-gray-100">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors z-10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            {detailLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <div className="relative h-48 -mx-6 -mt-6 mb-6">
                  {selectedEventDetail.imageUrl ? (
                    <img src={selectedEventDetail.imageUrl} alt={selectedEventDetail.title} className="w-full h-full object-cover rounded-t-3xl" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col items-center justify-center rounded-t-3xl">
                      <Calendar size={48} className="text-blue-300 mb-2" />
                      <span className="text-blue-400 font-bold text-sm">UniVibe Etkinliği</span>
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
                      {new Date(selectedEventDetail.eventDate).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <MapPin size={18} className="text-red-500" />
                    <span className="text-sm font-semibold">{selectedEventDetail.location || "Belirtilmemiş"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <User size={16} className="text-purple-500" />
                      <span className="text-xs font-semibold truncate">{selectedEventDetail.creatorName || selectedEventDetail.organizerName || "Bilinmiyor"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <Tag size={16} className="text-green-500" />
                      <span className="text-xs font-semibold truncate">{selectedEventDetail.categoryName || "Kategori Yok"}</span>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {selectedEventDetail.description || "Açıklama bulunmuyor."}
                    </p>
                  </div>
                  
                  {!selectedEventDetail.isCreator && !selectedEventDetail.isJoined && (
                    <button
                      onClick={() => handleJoinEvent(selectedEventDetail.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
                    >
                      {t("Student_JoinEventBtn") || "Etkinliğe Katıl"}
                    </button>
                  )}
                  {selectedEventDetail.isJoined && (
                    <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-3.5 rounded-xl text-sm text-center">
                      ✓ Katıldınız
                    </div>
                  )}
                  {selectedEventDetail.isCreator && (
                    <div className="w-full bg-gray-100 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl text-sm text-center">
                      Sizin Etkinliğiniz
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}