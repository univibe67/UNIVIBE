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
    <div className="event-card group">
      <div className="event-card-image bg-gray-100">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-semibold bg-purple-50">
            {t("Student_NoImage") || "Görsel Yok"}
          </div>
        )}
        <span className="absolute top-4 right-4 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-black text-blue-700 shadow-md">
          {event.categoryName || "Genel"}
        </span>
      </div>

      <div className="event-card-body">
        <div className="space-y-2">
          <h3 className="line-clamp-1">{event.title}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed font-medium text-gray-500">
            {event.description || "Açıklama belirtilmemiş."}
          </p>
        </div>

        <div className="event-card-meta border-t border-gray-100 pt-4 font-medium">
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="shrink-0 text-blue-500" />
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
            <MapPin size={15} className="shrink-0 text-rose-400" />
            <span className="truncate">{event.location || "Konum belirtilmemiş"}</span>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => onViewDetail(event)}
            className="event-card-action"
          >
            <Eye size={16} />
            <span>{t("Student_ViewDetails") || "Detayları Gör"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}