import { Calendar, MapPin, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

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

interface EventCardProps {
  event: EventItem;
  onViewDetail: (event: EventItem) => void;
}

export default function EventCard({ event, onViewDetail }: EventCardProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-purple-100 shadow-md hover:shadow-xl transition-all flex flex-col overflow-hidden group hover:-translate-y-1">
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold bg-purple-50">
            {t("Student_NoImage") || "Görsel Yok"}
          </div>
        )}
        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-purple-700 shadow-md">
          {event.categoryName || "Genel"}
        </span>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="font-extrabold text-gray-900 text-xl line-clamp-1">{event.title}</h3>
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">
            {event.description || "Açıklama belirtilmemiş."}
          </p>
        </div>

        <div className="space-y-2.5 pt-4 border-t border-purple-50 text-xs text-gray-600 font-medium">
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="text-purple-500 shrink-0" />
            <span>
              {event.eventDate ? new Date(event.eventDate).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }) : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin size={15} className="text-pink-500 shrink-0" />
            <span className="truncate">{event.location || "Konum belirtilmemiş"}</span>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onViewDetail(event)}
            className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-3 rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 border border-purple-100"
          >
            <Eye size={16} />
            <span>{t("Student_ViewDetails") || "Detayları Gör"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}