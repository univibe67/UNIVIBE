import { useTranslation } from "react-i18next";
import Badge from "../ui/Badge";
import { effectiveEventStatus, eventStatusMeta } from "../../utils/eventStatus";

interface EventStatusBadgeProps {
  status?: string | number | null;
  isDeleted?: boolean;
  className?: string;
}

export default function EventStatusBadge({ status, isDeleted, className }: EventStatusBadgeProps) {
  const { t } = useTranslation();
  const { labelKey, tone } = eventStatusMeta(effectiveEventStatus({ status, isDeleted }));
  return (
    <Badge tone={tone} className={className}>
      {t(labelKey)}
    </Badge>
  );
}
