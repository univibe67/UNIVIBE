import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  MapPin,
  User,
  Tag,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../services/api";

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

export default function StudentEventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchEventDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const response: any = await api.get(`/Events/${id}`);
      const data = response.data?.data || response.data || response;
      if (data && data.id) {
        setEvent(data);
      } else {
        setError("Etkinlik bulunamadı.");
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Etkinlik detayları yüklenirken bir sorun oluştu."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEventDetail();
  }, [fetchEventDetail]);

  const handleJoinEvent = async () => {
    if (!id) return;
    try {
      await api.post(`/Events/join/${id}`);
      showNotification(
        "success",
        t("Student_JoinSuccess") || "Etkinliğe başarıyla katıldınız!"
      );
      fetchEventDetail();
    } catch (err: any) {
      showNotification(
        "error",
        err?.response?.data?.message ||
          t("Student_JoinError") ||
          "Katılım sırasında bir hata oluştu."
      );
    }
  };

  const handleConfirmCancel = async () => {
    if (!id) return;
    if (!cancelReason.trim()) {
      setCancelError(t("Admin_Reason_Required") || "Lütfen iptal nedeni girin.");
      return;
    }

    setIsCancelling(true);
    try {
      await api.post(`/Events/cancel-event/${id}`, {
        reason: cancelReason,
      });
      showNotification(
        "success",
        t("Student_CancelSuccess") || "Etkinlik iptal edildi."
      );
      setCancelModalOpen(false);
      setTimeout(() => {
        navigate("/student/home");
      }, 700);
    } catch (err: any) {
      setCancelError(
        err?.response?.data?.message ||
          t("Student_CancelError") ||
          "İptal işlemi başarısız oldu."
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const renderStatusBadge = (status: string | number) => {
    const s = String(status).toLowerCase();
    if (status === 1 || s === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock size={13} />
          {t("Admin_Status_Pending") || "Onay Bekliyor"}
        </span>
      );
    }
    if (status === 2 || s === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={13} />
          {t("Admin_Status_Approved") || "Onaylandı"}
        </span>
      );
    }
    if (status === 3 || s === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle size={13} />
          {t("Admin_Status_Rejected") || "Reddedildi"}
        </span>
      );
    }
    if (status === 4 || s === "cancelled") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
          <AlertCircle size={13} />
          {t("Admin_Status_Cancelled") || "İptal Edildi"}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl text-white font-bold shadow-lg max-w-sm w-full transform transition-all duration-300 ${
            notification.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === "success" ? (
              <CheckCircle2 size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}
            <span className="text-sm">{notification.text}</span>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="bg-white px-6 py-4 shadow-sm border-b border-gray-100 flex items-center gap-4 sticky top-0 z-30">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-1.5 text-sm font-bold"
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Geri</span>
        </button>
        <h1 className="text-lg font-black text-gray-900 truncate">
          {event?.title || "Etkinlik Detayı"}
        </h1>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium text-sm">Etkinlik detayları yükleniyor...</p>
          </div>
        ) : error || !event ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 space-y-4">
            <AlertCircle size={48} className="mx-auto text-rose-500" />
            <h2 className="text-xl font-bold text-gray-900">Etkinlik Bulunamadı</h2>
            <p className="text-sm text-gray-500">{error || "Bu etkinliğe ulaşılamıyor."}</p>
            <button
              onClick={() => navigate("/student/events")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-2xl text-sm transition-colors"
            >
              Etkinliklerime Dön
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden space-y-6">
            {/* Banner Image */}
            <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-100">
              {event.imageUrl ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 flex flex-col items-center justify-center">
                  <Calendar size={56} className="text-blue-300 mb-2" />
                  <span className="text-blue-500 font-bold text-base">UniVibe Etkinliği</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <div className="mb-3">{renderStatusBadge(event.status)}</div>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-sm">
                  {event.title}
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 pt-0 space-y-6">
              {/* Event Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3.5 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <Calendar size={22} className="text-blue-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Tarih & Saat
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleString("tr-TR", {
                            dateStyle: "long",
                            timeStyle: "short",
                          })
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <MapPin size={22} className="text-rose-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Konum
                    </span>
                    <span className="text-sm font-bold text-gray-800">
                      {event.location || "Belirtilmemiş"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <User size={20} className="text-purple-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Düzenleyen
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {event.creatorName || event.organizerName || "Bilinmiyor"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3.5 text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <Tag size={20} className="text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Kategori
                    </span>
                    <span className="text-sm font-semibold text-gray-800">
                      {event.categoryName || "Genel"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-blue-50/40 p-5 rounded-2xl border border-blue-100 space-y-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-blue-900 block">
                  Etkinlik Açıklaması
                </span>
                <p className="text-sm text-gray-700 leading-relaxed font-normal whitespace-pre-line">
                  {event.description || "Bu etkinlik için bir açıklama girilmemiş."}
                </p>
              </div>

              {/* Rejection / Cancellation Notes */}
              {event.rejectionReason && (
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-xs text-rose-800 space-y-1.5">
                  <span className="font-bold flex items-center gap-2 text-rose-900 text-sm">
                    <AlertTriangle size={16} /> Reddetme Gerekçesi
                  </span>
                  <p className="leading-relaxed">{event.rejectionReason}</p>
                </div>
              )}

              {event.cancellationReason && (
                <div className="bg-gray-100 border border-gray-200 p-4 rounded-2xl text-xs text-gray-800 space-y-1.5">
                  <span className="font-bold flex items-center gap-2 text-gray-900 text-sm">
                    <XCircle size={16} /> İptal Gerekçesi
                  </span>
                  <p className="leading-relaxed">{event.cancellationReason}</p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-100">
                {event.isCreator ? (
                  <div className="space-y-3">
                    <div className="w-full bg-blue-50 border border-blue-200 text-blue-700 font-bold py-3 rounded-2xl text-xs text-center">
                      Bu Etkinliği Siz Oluşturdunuz
                    </div>
                    {String(event.status).toLowerCase() !== "cancelled" && event.status !== 4 && (
                      <button
                        onClick={() => {
                          setCancelReason("");
                          setCancelError("");
                          setCancelModalOpen(true);
                        }}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl text-sm transition-colors flex items-center justify-center gap-2 border border-red-200"
                      >
                        <XCircle size={18} />
                        Etkinliği İptal Et
                      </button>
                    )}
                  </div>
                ) : event.isJoined ? (
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold py-3.5 rounded-2xl text-sm text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    Bu Etkinliğe Katıldınız
                  </div>
                ) : (
                  <button
                    onClick={handleJoinEvent}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors shadow-lg shadow-blue-600/20"
                  >
                    {t("Student_JoinEventBtn") || "Etkinliğe Katıl"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-4 shadow-2xl relative border border-blue-100">
            <h3 className="text-xl font-black text-gray-900">Etkinliği İptal Et</h3>
            <p className="text-xs text-gray-500 font-medium">
              Lütfen bu etkinliği neden iptal ettiğinizi belirtin.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                if (cancelError) setCancelError("");
              }}
              placeholder="İptal nedeni..."
              className="w-full p-4 border border-blue-100 rounded-2xl outline-none text-sm h-32 resize-none bg-blue-50/40 focus:border-blue-500 font-medium"
            />
            {cancelError && <p className="text-xs text-red-600 font-bold">{cancelError}</p>}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-sm transition-colors"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {isCancelling ? "İptal Ediliyor..." : "İptali Onayla"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
