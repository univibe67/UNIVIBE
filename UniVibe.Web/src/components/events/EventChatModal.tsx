import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import IconTile from "../ui/IconTile";
import Modal from "../ui/Modal";
import EventCommentsChat from "../EventCommentsChat";

export default function EventChatModal({ event, onClose }: { event: EventItem | null; onClose: () => void }) {
  const { t } = useTranslation();
  if (!event) return null;

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={<span className="line-clamp-1">{event.title}</span>}
      description={t("Event_CommentsModalSubtitle")}
      icon={
        <IconTile>
          <MessageCircle size={19} />
        </IconTile>
      }
    >
      <EventCommentsChat
        eventId={event.id}
        isJoined={event.isJoined}
        isCreator={event.isCreator}
        creatorId={event.creatorId ?? event.createdById ?? event.organizerId ?? event.userId}
      />
    </Modal>
  );
}
