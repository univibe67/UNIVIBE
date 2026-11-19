import type { ReactNode } from "react";
import { CalendarClock, GraduationCap, MapPin, Tag, UserRound, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types/event";
import { formatCategoryName } from "../../utils/categoryLabel";
import { formatDateTime } from "../../utils/format";
import { gradeLabelKey } from "../../utils/grades";

function Fact({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-sm font-medium break-words text-ink-900">{children}</dd>
      </div>
    </div>
  );
}

export default function EventFacts({ event }: { event: EventItem }) {
  const { t, i18n } = useTranslation();
  const minGrade = gradeLabelKey(event.minGrade);
  const maxGrade = gradeLabelKey(event.maxGrade);
  const gradeRange = [minGrade && t(minGrade), maxGrade && t(maxGrade)].filter(Boolean).join(" – ");
  const audience = [event.targetFaculty, event.targetDepartment, gradeRange].filter(Boolean);

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Fact icon={<CalendarClock size={17} />} label={t("UI_DateTime")}>
        {formatDateTime(event.eventDate, i18n.language)}
      </Fact>
      <Fact icon={<MapPin size={17} />} label={t("Student_FieldLocation")}>
        {event.location || t("Student_NotSpecified")}
      </Fact>
      <Fact icon={<UserRound size={17} />} label={t("Student_OrganizerLabel")}>
        {event.creatorName || event.organizerName || t("Student_Unknown")}
      </Fact>
      <Fact icon={<Tag size={17} />} label={t("Student_CategoryLabel")}>
        {formatCategoryName(event.categoryName, t)}
      </Fact>
      {event.participantCount !== undefined && (
        <Fact icon={<Users size={17} />} label={t("Admin_Participants")}>
          {event.participantCount}
        </Fact>
      )}
      {audience.length > 0 && (
        <Fact icon={<GraduationCap size={17} />} label={t("Admin_TargetAudience")}>
          {audience.join(" · ")}
        </Fact>
      )}
    </dl>
  );
}
