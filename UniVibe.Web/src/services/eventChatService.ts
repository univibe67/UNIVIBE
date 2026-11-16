import { api } from "./api";

export interface EventMessageItem {
  id: string;
  eventId: string;
  userId: string;
  senderName: string;
  senderProfileImage?: string | null;
  content: string;
  createdAt: string;
}

export function normalizeMessage(raw: any): EventMessageItem {
  return {
    id: String(raw?.id ?? raw?.Id ?? `${Date.now()}-${Math.random()}`),
    eventId: String(raw?.eventId ?? raw?.EventId ?? ""),
    userId: String(raw?.userId ?? raw?.UserId ?? ""),
    senderName: String(raw?.senderName ?? raw?.SenderName ?? "Katılımcı"),
    senderProfileImage: raw?.senderProfileImage ?? raw?.SenderProfileImage ?? null,
    content: String(raw?.content ?? raw?.Content ?? ""),
    createdAt: String(raw?.createdAt ?? raw?.CreatedAt ?? new Date().toISOString()),
  };
}

export function getEventChatHubUrl(): string {
  const apiUrl = (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";
  const base = apiUrl.replace(/\/api\/?$/i, "");
  return `${base}/hubs/event-chat`;
}

export async function getEventMessages(
  eventId: string,
  pageNumber: number = 1,
  pageSize: number = 50
): Promise<EventMessageItem[]> {
  try {
    const res: any = await api.get(`/events/${eventId}/messages`, {
      params: { pageNumber, pageSize },
    });
    const data = res.data?.data || res.data || (Array.isArray(res) ? res : []);
    if (Array.isArray(data)) {
      return data.map(normalizeMessage);
    }
    return [];
  } catch {
    // 403 Forbidden veya hata durumunda asla arka planda
    // POST /events/{id}/attendees çağrısı yapılmaz; güvenle boş liste dönülür.
    return [];
  }
}

export async function sendEventMessageHttp(
  eventId: string,
  content: string
): Promise<EventMessageItem> {
  const res: any = await api.post(`/events/${eventId}/messages`, {
    content: content.trim(),
  });
  const data = res.data?.data || res.data;
  return normalizeMessage(data);
}
