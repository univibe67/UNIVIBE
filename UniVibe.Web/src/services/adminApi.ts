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
  categoryId?: string;
  categoryName?: string;
  eventDate: string;
  location?: string;
  status: string | number;
  organizerName?: string;
  creatorName?: string;
  imageUrl?: string | null;
  department?: string | null;
  grade?: number | null;
  isCreator?: boolean;
  isJoined?: boolean;
  isDeleted?: boolean;
  participantCount?: number;
  rejectionReason?: string | null;
  cancellationReason?: string | null;
  minGrade?: number | null;
  maxGrade?: number | null;
  targetFaculty?: string | null;
  targetDepartment?: string | null;
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
    try {
      const result = await request<PaginatedUsers>(api.get(
        `/admin/users?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      ));
      const items = result?.items ?? (result as any)?.data?.items ?? (Array.isArray(result) ? result : []);
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
    }
  },
  suspendUser: (id: string) => request(api.patch(`/admin/users/${id}/suspension`)),
  activateUser: (id: string) => request(api.patch(`/admin/users/${id}/activation`)),
  deleteUser: (id: string) => request(api.delete(`/admin/users/${id}`)),
  changeUserRole: (id: string, newRole: UserRole | number) =>
    request(api.patch(`/admin/users/${id}/role`, { newRole })),
  getPendingEvents: async () => {
    try {
      const res: any = await api.get("/admin/events/pending");
      const list = res?.data || res;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
  getEvents: async () => {
    try {
      const res: any = await api.get("/admin/events");
      const list = res?.data || res;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
  getEvent: (id: string) => request<AdminEvent>(api.get(`/admin/events/${id}`)),
  approveEvent: (id: string) =>
    request(api.patch(`/admin/events/${id}/approval`)),
  rejectEvent: (id: string, reason: string) =>
    request(api.patch(`/admin/events/${id}/rejection`, { reason })),
  getFeedbacks: async () => {
    try {
      const res: any = await api.get("/feedbacks");
      const list = res?.data || res;
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  },
  resolveFeedback: (id: string) =>
    request(api.patch(`/feedbacks/${id}/resolution`, {})),
  getStatistics: () => request<EventStatistics>(api.get("/events/statistics")),
};
