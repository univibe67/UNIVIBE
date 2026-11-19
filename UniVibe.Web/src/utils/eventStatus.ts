import type { BadgeTone } from "../components/ui/Badge";

export const EventStatus = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
  Cancelled: 4,
  Completed: 5,
} as const;

interface StatusSubject {
  status?: string | number | null;
  eventDate?: string | null;
  isDeleted?: boolean;
}

export function normalizeEventStatus(status?: string | number | null): number {
  if (status === null || status === undefined) return EventStatus.Pending;
  const value = String(status).toLowerCase().trim();
  if (["1", "pending", "onay bekliyor"].includes(value)) return EventStatus.Pending;
  if (["2", "approved", "onaylandi", "onaylandı"].includes(value)) return EventStatus.Approved;
  if (["3", "rejected", "reddedildi"].includes(value)) return EventStatus.Rejected;
  if (["4", "cancelled", "canceled", "iptal", "iptal edildi"].includes(value)) return EventStatus.Cancelled;
  if (["5", "completed", "tamamlandi", "tamamlandı"].includes(value)) return EventStatus.Completed;
  const parsed = Number(status);
  return Number.isNaN(parsed) ? EventStatus.Pending : parsed;
}

export function effectiveEventStatus(event: StatusSubject): number {
  return event.isDeleted ? EventStatus.Cancelled : normalizeEventStatus(event.status);
}

export function eventStatusMeta(status: number): { labelKey: string; tone: BadgeTone } {
  switch (status) {
    case EventStatus.Approved:
      return { labelKey: "Admin_Status_Approved", tone: "success" };
    case EventStatus.Rejected:
      return { labelKey: "Admin_Status_Rejected", tone: "danger" };
    case EventStatus.Cancelled:
      return { labelKey: "Admin_Status_Cancelled", tone: "neutral" };
    case EventStatus.Completed:
      return { labelKey: "Admin_Status_Completed", tone: "brand" };
    default:
      return { labelKey: "Admin_Status_Pending", tone: "warning" };
  }
}

export function isEventPast(eventDate: string | null | undefined, now: number): boolean {
  if (!eventDate) return false;
  const time = new Date(eventDate).getTime();
  return !Number.isNaN(time) && time <= now;
}

export function canApproveEvent(event: StatusSubject, now: number): boolean {
  if (event.isDeleted || isEventPast(event.eventDate, now)) return false;
  return normalizeEventStatus(event.status) === EventStatus.Pending;
}

export function canRejectEvent(event: StatusSubject, now: number): boolean {
  if (event.isDeleted || isEventPast(event.eventDate, now)) return false;
  const status = normalizeEventStatus(event.status);
  return status === EventStatus.Pending || status === EventStatus.Approved;
}

export function approveHintKey(event: StatusSubject, now: number): string {
  const status = effectiveEventStatus(event);
  if (status === EventStatus.Cancelled) return "Admin_EventCannotApproveCancelled";
  if (isEventPast(event.eventDate, now)) return "Admin_EventCannotApprovePast";
  if (status === EventStatus.Approved) return "Admin_Status_Approved";
  if (status === EventStatus.Rejected) return "Admin_EventCannotApproveRejected";
  if (status === EventStatus.Completed) return "Admin_Status_Completed";
  return "Admin_Approve";
}

export function rejectHintKey(event: StatusSubject, now: number): string {
  const status = effectiveEventStatus(event);
  if (status === EventStatus.Cancelled) return "Admin_EventCannotRejectCancelled";
  if (isEventPast(event.eventDate, now)) return "Admin_EventCannotRejectPast";
  if (status === EventStatus.Rejected) return "Admin_EventAlreadyRejected";
  if (status === EventStatus.Completed) return "Admin_Status_Completed";
  return "Admin_Reject";
}
