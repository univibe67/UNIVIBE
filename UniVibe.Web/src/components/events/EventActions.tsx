import { CircleCheck, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import { isEventActiveAndJoinable, isEventInFuture } from "../../utils/eventFilter";
import Button from "../ui/Button";

interface EventActionsProps {
  event: EventItem;
  joining: boolean;
  leaving: boolean;
  onJoin: () => void;
  onLeave: () => void;
}

export default function EventActions({ event, joining, leaving, onJoin, onLeave }: EventActionsProps) {
  const { t } = useTranslation();

  if (event.isCreator) {
    return (
      <p className="flex min-h-11 items-center justify-center text-center text-sm font-medium text-brand-700">
        {t("Student_CreatedByYou")}
      </p>
    );
  }

  if (event.isJoined) {
    return (
      <>
        {isEventInFuture(event.eventDate) && (
          <Button variant="dangerSoft" onClick={onLeave} loading={leaving}>
            {!leaving && <LogOut size={16} aria-hidden="true" />}
            {leaving ? t("Student_Leaving") : t("Student_LeaveEventBtn")}
          </Button>
        )}
        <p className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
          <CircleCheck size={17} aria-hidden="true" />
          {t("Student_JoinedBadge")}
        </p>
      </>
    );
  }

  if (!isEventActiveAndJoinable(event)) return null;

  return (
    <Button onClick={onJoin} loading={joining}>
      {t("Student_JoinEventBtn")}
    </Button>
  );
}
