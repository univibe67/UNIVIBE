export interface EventItem {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  location?: string;
  creatorName?: string;
  organizerName?: string;
  creatorId?: string;
  createdById?: string;
  organizerId?: string;
  userId?: string;
  eventDate: string;
  status: string | number;
  categoryId?: string;
  categoryName?: string;
  isCreator?: boolean;
  isJoined?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  participantCount?: number;
  minGrade?: number | null;
  maxGrade?: number | null;
  targetFaculty?: string | null;
  targetDepartment?: string | null;
  cancellationReason?: string | null;
  rejectionReason?: string | null;
}

export type EventRoleFlags = Pick<EventItem, "isJoined" | "isCreator">;
