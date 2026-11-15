import { api } from "./api";
import type { UserRole } from "../utils/userRole";

const request = <T>(value: Promise<unknown>) => value as unknown as Promise<T>;

export interface AdminUser {
  id: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  email?: string;
  role: string | number;
  isActive: boolean;
  isDeleted?: boolean;
}

export interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  categoryName?: string;
  eventDate: string;
  location?: string;
  status: string | number;
  organizerName?: string;
  isDeleted?: boolean;
  participantCount?: number;
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface AdminFeedback {
  id: string;
  subject?: string;
  message?: string;
  userFullName?: string;
  createdAt: string;
  isResolved: boolean;
}

export interface EventStatistics {
  totalCreatedEvents: number;
  activeEvents: number;
  pendingEvents: number;
}

interface PaginatedUsers {
  items: AdminUser[];
  totalCount: number;
}

export const adminApi = {
  getUsers: async (pageNumber = 1, pageSize = 100) => {
    const result = await request<PaginatedUsers>(api.get(
      `/admin/users?pageNumber=${pageNumber}&pageSize=${pageSize}`,
    ));
    return result.items ?? [];
  },
  suspendUser: (id: string) => request(api.patch(`/admin/users/${id}/suspension`)),
  activateUser: (id: string) => request(api.patch(`/admin/users/${id}/activation`)),
  deleteUser: (id: string) => request(api.delete(`/admin/users/${id}`)),
  changeUserRole: (id: string, newRole: UserRole | number) =>
    request(api.patch(`/admin/users/${id}/role`, { newRole })),
  getPendingEvents: () => request<AdminEvent[]>(api.get("/admin/events/pending")),
  getEvents: () => request<AdminEvent[]>(api.get("/admin/events")),
  getEvent: (id: string) => request<AdminEvent>(api.get(`/admin/events/${id}`)),
  approveEvent: (id: string) =>
    request(api.patch(`/admin/events/${id}/approval`)),
  rejectEvent: (id: string, reason: string) =>
    request(api.patch(`/admin/events/${id}/rejection`, { reason })),
  getFeedbacks: () => request<AdminFeedback[]>(api.get("/feedbacks")),
  resolveFeedback: (id: string) =>
    request(api.patch(`/feedbacks/${id}/resolution`)),
  getStatistics: () => request<EventStatistics>(api.get("/events/statistics")),
};
