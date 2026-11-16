import { useState, useEffect, useMemo } from "react";
import type { ChangeEvent } from "react";
import { Search, MapPin, Calendar, User, Tag, MessageCircle, X, CheckCircle2, LogOut, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import EventCard from "../../components/EventCard";
import EventCommentsChat from "../../components/EventCommentsChat";
import { getErrorMessage } from "../../services/errorMessage";
import { tokenService } from "../../services/tokenService";
import { formatCategoryName } from "../../utils/categoryLabel";
import { isEventActiveAndJoinable, isEventInFuture } from "../../utils/eventFilter";

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
  isActive?: boolean;
  isDeleted?: boolean;
}

interface PaginatedResponse<T> {
  items?: T[];
  Items?: T[];
  totalCount?: number;
  TotalCount?: number;
  totalItems?: number;
  TotalItems?: number;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
}

interface ApiResponse<T> {
  data?: T;
  message?: string;
  errors?: string[];
  isSuccessful?: boolean;
}

function getApiData<T>(response: unknown): T | undefined {
  if (!response || typeof response !== "object") {
    return undefined;
  }

  const value = response as Record<string, unknown>;
  if ("isSuccessful" in value) {
    return value.data as T | undefined;
  }

  return response as T;
}

export default function StudentHome() {
  const { t, i18n } = useTranslation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedEventDetail, setSelectedEventDetail] = useState<EventItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [selectedCommentsEvent, setSelectedCommentsEvent] = useState<EventItem | null>(null);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchEventsAndCategories = async () => {
    if (tokenService.isTokenExpired(undefined, 0)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [eventsResult, profileResult] = await Promise.allSettled([
        api.get<PaginatedResponse<EventItem> | ApiResponse<PaginatedResponse<EventItem>>>("/events", {
          params: { PageNumber: 1, PageSize: 50, OnlyActive: true },
        }),
        api.get<UserProfile | ApiResponse<UserProfile>>("/users/profile/me"),
      ]);

      if (eventsResult.status === "fulfilled") {
        const actualData = getApiData<PaginatedResponse<EventItem>>(eventsResult.value) ?? {};
        const items = actualData.items ?? actualData.Items ?? [];
        setEvents(items);
      } else {
        console.error("Etkinlikler yüklenirken hata oluştu:", getErrorMessage(eventsResult.reason));
        setEvents([]);
      }

      if (profileResult.status === "fulfilled") {
        setProfile(getApiData<UserProfile>(profileResult.value) ?? null);
      }
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
      const response = await api.get<EventItem | ApiResponse<EventItem>>(`/events/${eventItem.id}`);
      const fetchedData = getApiData<EventItem>(response);
      if (fetchedData) {
        setSelectedEventDetail(fetchedData);
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
      const response = await api.get<EventItem | ApiResponse<EventItem>>(`/events/${eventItem.id}`);
      const fetchedData = getApiData<EventItem>(response);
      if (fetchedData) {
        setSelectedCommentsEvent({
          ...fetchedData,
          isJoined: fetchedData.isJoined !== undefined ? fetchedData.isJoined : eventItem.isJoined,
          isCreator: fetchedData.isCreator !== undefined ? fetchedData.isCreator : eventItem.isCreator,
        });
      }
    } catch (error) {
      console.error("Yorum modalı için etkinlik bilgisi yüklenemedi:", error);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    try {
      await api.post(`/events/${eventId}/attendees`);
      showNotification("success", t("Student_JoinSuccess") || "Etkinliğe başarıyla katıldınız!");
      setSelectedEventDetail((prev) => (prev ? { ...prev, isJoined: true } : null));
      setSelectedCommentsEvent((prev) => (prev && prev.id === eventId ? { ...prev, isJoined: true } : prev));
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isJoined: true } : e))
      );
      void fetchEventsAndCategories();
    } catch (error: any) {
      const status = error?.response?.status || error?.status;
      if (status === 409) {
        setSelectedEventDetail((prev) => (prev ? { ...prev, isJoined: true } : null));
        setSelectedCommentsEvent((prev) => (prev && prev.id === eventId ? { ...prev, isJoined: true } : prev));
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, isJoined: true } : e))
        );
        showNotification("success", t("Student_AlreadyJoinedNotice") || "Bu etkinliğe zaten katılmışsınız.");
        void fetchEventsAndCategories();
        return;
      }
      showNotification(
        "error",
        getErrorMessage(error) || t("Student_JoinError") || "Katılım sırasında bir hata oluştu.",
      );
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    setIsLeaving(true);
    try {
      await api.delete(`/events/${eventId}/attendees/me`);
      showNotification(
        "success",
        t("Student_LeaveSuccess") || "Etkinlikten başarıyla ayrıldınız."
      );
      setSelectedEventDetail((prev) => (prev ? { ...prev, isJoined: false } : null));
      setSelectedCommentsEvent((prev) => (prev && prev.id === eventId ? { ...prev, isJoined: false } : prev));
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, isJoined: false } : e))
      );
      await fetchEventsAndCategories();
    } catch (error: any) {
      showNotification(
        "error",
        getErrorMessage(error) || t("Student_LeaveError") || "Etkinlikten ayrılırken bir sorun oluştu."
      );
    } finally {
      setIsLeaving(false);
    }
  };

  const categories = [
    { value: "", label: t("Admin_All") },
    { value: "Sanat ve Kültür", label: t("Category_ArtsCulture") },
    { value: "Akademik", label: t("Category_Academic") },
    { value: "Müzik ve Eğlence", label: t("Category_MusicEntertainment") },
    { value: "Kulüp ve Sosyal", label: t("Category_ClubsSocial") },
    { value: "Spor", label: t("Category_Sports") },
    { value: "Teknoloji", label: t("Category_Technology") },
  ];
  // Aktif ve katılınabilir etkinlikler:
  // 1. Onaylanmış (Approved / aktif statüde) - taslak, bekleyen veya reddedilenler hariç
  // 2. Gelecek tarihte/saatte olanlar - geçmiş etkinlikler hariç
  const activeEvents = useMemo(() => {
    return events.filter(isEventActiveAndJoinable);
  }, [events]);

  // Banner sayacı: aktif ve katılınabilir etkinliklerin sayısı
  const eventCount = activeEvents?.length ?? 0;

  // "Senin için etkinlikler" listesi: banner sayacıyla birebir aynı aktif/katılınabilir
  // filtreleme mantığı temel alınarak arama terimi ve kategori filtresi uygulanır
  const filteredEvents = useMemo(() => {
    return (activeEvents || []).filter((event) => {
      const matchesSearch = (event.title ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        !selectedCategory ||
        event.categoryName?.toLocaleLowerCase("tr-TR") === selectedCategory.toLocaleLowerCase("tr-TR");

      return matchesSearch && matchesCategory;
    });
  }, [activeEvents, searchTerm, selectedCategory]);
  const displayName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "UniVibe";
  const initials = displayName === "UniVibe"
    ? "U"
    : displayName.split(" ").map((part) => part.charAt(0)).join("").slice(0, 2).toUpperCase();
  return (
    <div className="student-page">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg ${notification.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {notification.text}
        </div>
      )}
      <div className="student-content">
        <div className="student-topbar">
          <div className="brand-lockup"><span className="brand-mark">U</span><span>Uni<strong>Vibe</strong></span></div>
        </div>
        <div className="student-greeting">
          {profile?.profilePictureUrl ? (
            <img className="student-avatar student-avatar-image" src={profile.profilePictureUrl} alt={displayName} />
          ) : (
            <div className="student-avatar">{initials}</div>
          )}
          <div><small>{t("Student_Greeting")}</small><strong>{displayName === "UniVibe" ? t("Student_Welcome") : `${t("Student_Welcome").replace("UniVibe", displayName)}`}</strong></div>
        </div>
        <section className="student-hero">
          <div className="auth-eyebrow">{t("Student_HeroEyebrow")}</div>
          <h1>{t("Student_HeroTitle")}</h1>
          <p>{t("Student_HeroDescription")}</p>
          <div className="hero-count"><strong>{eventCount}</strong><span>{t("Student_NewEvents")}</span></div>
        </section>
        <div className="section-heading">
          <div><div className="auth-eyebrow">{t("Student_Discover")}</div><h2>{t("Student_ForYou")}</h2></div>
        </div>
        <div className="category-scroller">
          {categories.map((category) => (
            <button
              type="button"
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`category-pill ${selectedCategory === category.value ? "active" : ""}`}
            >
              {category.label}
            </button>
          ))}
        </div>

      <div className="space-y-6 max-w-7xl mx-auto">
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
            <p className="text-gray-500 font-medium">{t("Student_Loading")}</p>
          </div>
        ) : (filteredEvents?.length ?? 0) > 0 ? (
          <div className="event-grid">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onViewDetail={() => handleOpenDetail(event)}
                onOpenComments={() => handleOpenComments(event)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Search className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 font-medium text-center">{t("Student_NoEvents")}</p>
          </div>
        )}
      </div>

      </div>
      {/* Etkinlik Detay Modalı */}
      {isDetailModalOpen && selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative border border-gray-100">
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
                      {new Date(selectedEventDetail.eventDate).toLocaleString(i18n.language === "en" ? "en-US" : "tr-TR", { dateStyle: "long", timeStyle: "short" })}
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
                  
                  {!selectedEventDetail.isCreator && !selectedEventDetail.isJoined && (
                    <button
                      onClick={() => handleJoinEvent(selectedEventDetail.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-blue-600/20"
                    >
                      {t("Student_JoinEventBtn") || "Etkinliğe Katıl"}
                    </button>
                  )}
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
                          disabled={isLeaving}
                          className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isLeaving ? (
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
                      Sizin Etkinliğiniz
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