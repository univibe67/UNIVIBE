import { useState, useEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { MessageCircle, Send, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { tokenService } from "../services/tokenService";
import { getErrorMessage } from "../services/errorMessage";
import {
  getEventChatHubUrl,
  getEventMessages,
  sendEventMessageHttp,
  type EventMessageItem,
} from "../services/eventChatService";

interface EventCommentsChatProps {
  eventId: string;
  isJoined?: boolean;
  isCreator?: boolean;
  creatorId?: string;
  creatorName?: string;
  organizerName?: string;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarBg(name?: string): string {
  if (!name) return "bg-blue-600";
  const colors = [
    "bg-gradient-to-tr from-blue-500 to-indigo-600",
    "bg-gradient-to-tr from-purple-500 to-pink-600",
    "bg-gradient-to-tr from-emerald-500 to-teal-600",
    "bg-gradient-to-tr from-amber-500 to-orange-600",
    "bg-gradient-to-tr from-rose-500 to-red-600",
    "bg-gradient-to-tr from-sky-500 to-blue-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function formatMessageTime(dateString: string, currentLang: string = "tr"): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString(currentLang.startsWith("en") ? "en-US" : "tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return timeStr;
    }

    const dateStr = d.toLocaleDateString(currentLang.startsWith("en") ? "en-US" : "tr-TR", {
      day: "numeric",
      month: "short",
    });

    return `${dateStr}, ${timeStr}`;
  } catch {
    return "";
  }
}

export default function EventCommentsChat({
  eventId,
  isJoined,
  isCreator,
  creatorId,
  creatorName,
  organizerName,
  className = "",
}: EventCommentsChatProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<EventMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const connectionRef = useRef<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Giriş yapan kullanıcının kimliği
  const currentUserId = tokenService.getUserId();

  // Etkinlik sahibi ID'si (doğrudan veya isCreator'dan)
  const effectiveCreatorId =
    creatorId || (isCreator && currentUserId ? currentUserId : undefined);

  // 1. Etkinliğe katılmış olan kullanıcılar (joined / participant)
  const isJoinedUser = Boolean(isJoined);

  // 2. Etkinliği oluşturan kullanıcı (creator / organizer)
  const isCreatorUser = Boolean(
    isCreator ||
      (effectiveCreatorId &&
        currentUserId &&
        effectiveCreatorId.toLowerCase() === currentUserId.toLowerCase())
  );

  // canAccessChat: Kimler mesajları okuyabilir ve SignalR'a bağlanabilir?
  // Backend kuralı (EventMessageService): Yalnızca etkinliğe katılmış olanlar (isAttendee) veya oluşturan organizatör (isCreator).
  // Admin dahi olsa etkinliğe katılmamışsa backend 403 Forbidden döner; bu sebeple yalnızca katılmış veya organizatör olanlar erişebilir.
  const canAccessChat = isJoinedUser || isCreatorUser;

  // canPostMessage: Yalnızca etkinliğe katılmış olan veya organizatör olan kullanıcılar mesaj yazabilir
  // (Admin dahi olsa backend kuralı gereği etkinliğe katılmamışsa mesaj gönderemez)
  const canPostMessage = isJoinedUser || isCreatorUser;

  const cleanCreatorName = (creatorName || organizerName || "").trim().toLowerCase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // 1. Önceki mesajları API üzerinden çek
  useEffect(() => {
    if (!eventId || !canAccessChat) {
      setIsLoading(false);
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    getEventMessages(eventId, 1, 50)
      .then((data) => {
        if (!isMounted) return;
        // Backend en yeni mesajı ilk sırada döndüğü için kronolojik sıralayalım
        const sorted = [...data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(sorted);
      })
      .catch((err) => {
        // Kullanıcı etkinliğe katılmamışsa backend 403 dönebilir
        console.warn("Geçmiş mesajlar yüklenirken bilgi:", getErrorMessage(err));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [eventId, canAccessChat]);

  // 2. SignalR Hub bağlantısı ve dinleyiciler
  useEffect(() => {
    if (!eventId || !canAccessChat) return;

    let isDisposed = false;
    const token = tokenService.getAccessToken();

    const connection = new HubConnectionBuilder()
      .withUrl(getEventChatHubUrl(), {
        transport: HttpTransportType.LongPolling,
        headers: {
          Authorization: `Bearer ${tokenService.getAccessToken() || ""}`,
        },
        accessTokenFactory: () => tokenService.getAccessToken() || "",
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.None)
      .build();

    connectionRef.current = connection;

    connection.on("ReceiveMessage", (rawMessage: any) => {
      if (isDisposed) return;
      const normalizedMsg: EventMessageItem = {
        id: String(rawMessage?.id ?? rawMessage?.Id ?? `${Date.now()}-${Math.random()}`),
        eventId: String(rawMessage?.eventId ?? rawMessage?.EventId ?? eventId),
        userId: String(rawMessage?.userId ?? rawMessage?.UserId ?? ""),
        senderName: String(rawMessage?.senderName ?? rawMessage?.SenderName ?? "Katılımcı"),
        senderProfileImage: rawMessage?.senderProfileImage ?? rawMessage?.SenderProfileImage ?? null,
        content: String(rawMessage?.content ?? rawMessage?.Content ?? ""),
        createdAt: String(rawMessage?.createdAt ?? rawMessage?.CreatedAt ?? new Date().toISOString()),
      };

      setMessages((prev) => {
        if (prev.some((m) => m.id === normalizedMsg.id)) {
          return prev;
        }
        return [...prev, normalizedMsg];
      });
    });

    connection.on("OnError", (errorMessage: string) => {
      if (isDisposed) return;
      const errLower = (errorMessage || "").toLowerCase();
      // Ham teknik yetki/erişim hatalarını kırmızı kutuda gösterme
      if (
        errLower.includes("accessdenied") ||
        errLower.includes("forbidden") ||
        errLower.includes("yetki")
      ) {
        return;
      }
      setChatError(errorMessage || "Bir sohbet hatası oluştu.");
      setTimeout(() => setChatError(null), 6000);
    });

    const connectHub = async () => {
      if (!token || isDisposed) return;
      try {
        if (connection.state === HubConnectionState.Disconnected) {
          await connection.start();
        }
        if (!isDisposed && connection.state === HubConnectionState.Connected) {
          await connection.invoke("JoinEventGroup", eventId);
        }
      } catch (err: unknown) {
        if (isDisposed) return;

        const errObj = err as { name?: string; message?: string } | undefined;
        const errName = errObj?.name || "";
        const errMsg = String(errObj?.message || err || "");
        const isAbort =
          errName === "AbortError" ||
          errMsg.includes("stopped during negotiation") ||
          errMsg.includes("stopped while negotiating") ||
          errMsg.includes("The connection was stopped") ||
          errMsg.includes("AbortError");

        if (!isAbort) {
          console.error("SignalR Hub bağlantı hatası:", err);
        }
      }
    };

    void connectHub();

    return () => {
      isDisposed = true;
      if (connectionRef.current === connection) {
        connectionRef.current = null;
      }
      try {
        if (connection.state === HubConnectionState.Connected) {
          connection.invoke("LeaveEventGroup", eventId).catch(() => {});
        }
      } catch {
        // ignore
      }
      connection.stop().catch(() => {});
    };
  }, [eventId, canAccessChat]);

  // Yeni mesaj geldiğinde otomatik aşağı kaydır
  useEffect(() => {
    if ((messages?.length ?? 0) > 0) {
      scrollToBottom();
    }
  }, [messages?.length]);

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || isSending || !canPostMessage) return;

    setIsSending(true);
    setChatError(null);

    try {
      const conn = connectionRef.current;
      if (conn && conn.state === HubConnectionState.Connected) {
        await conn.invoke("SendMessage", eventId, trimmed);
        setContent("");
      } else {
        // SignalR bağlantısı o an hazır değilse HTTP fallback
        const sent = await sendEventMessageHttp(eventId, trimmed);
        setMessages((prev) => (prev.some((m) => m.id === sent.id) ? prev : [...prev, sent]));
        setContent("");
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      const msgLower = (msg || "").toLowerCase();
      if (!msgLower.includes("accessdenied") && !msgLower.includes("yetki")) {
        setChatError(msg || "Mesajınız gönderilemedi.");
        setTimeout(() => setChatError(null), 6000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  return (
    <div className={`mt-6 border-t border-gray-100 pt-5 space-y-4 ${className}`}>
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle size={18} className="text-blue-600" />
          <span>{t("Event_CommentsTitle") || "Yorumlar & Sohbet"}</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            {messages?.length ?? 0}
          </span>
        </h3>
      </div>

      {/* Hata Bildirimi (Ham AccessDenied teknik hataları filtrelenir) */}
      {chatError &&
        !chatError.toLowerCase().includes("accessdenied") &&
        !chatError.toLowerCase().includes("yetki") && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium animate-fadeIn">
            <AlertCircle size={15} className="shrink-0 text-red-500" />
            <span>{chatError}</span>
          </div>
        )}

      {/* Mesaj Listesi */}
      <div className="bg-gray-50/70 border border-gray-100 rounded-2xl p-3.5 max-h-64 min-h-36 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 space-y-2 text-gray-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-xs font-medium">
              {t("Event_ChatLoading") || "Yorumlar yükleniyor..."}
            </span>
          </div>
        ) : (messages?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center text-gray-400 space-y-1">
            <MessageCircle size={28} className="text-gray-300 stroke-[1.5]" />
            <p className="text-xs font-medium">
              {canPostMessage
                ? t("Event_NoCommentsYet") || "Henüz yorum yapılmamış. İlk yorumu sen yap!"
                : t("Event_ChatJoinRequired") || "Yorum yazabilmek için önce etkinliğe katılmalısınız."}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = Boolean(
              currentUserId && msg.userId && msg.userId.toLowerCase() === currentUserId.toLowerCase()
            );

            // Organizatör kontrolü (etkinliği oluşturan) - Önce organizatör olup olmadığına bakılır
            const isOrganizer = Boolean(
              (effectiveCreatorId &&
                msg.userId &&
                msg.userId.toLowerCase() === effectiveCreatorId.toLowerCase()) ||
                (isCreator && isMe) ||
                (cleanCreatorName &&
                  msg.senderName &&
                  cleanCreatorName.length > 0 &&
                  msg.senderName.trim().toLowerCase() === cleanCreatorName)
            );

            const hasValidImage = msg.senderProfileImage && !imgErrors[msg.id];
            const initials = getInitials(msg.senderName);

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Profil Fotoğrafı veya Fallback Avatar */}
                {hasValidImage ? (
                  <img
                    src={msg.senderProfileImage!}
                    alt={msg.senderName}
                    onError={() => setImgErrors((prev) => ({ ...prev, [msg.id]: true }))}
                    className={`w-8 h-8 rounded-full object-cover shrink-0 shadow-xs ${
                      isOrganizer
                        ? "ring-1.5 ring-blue-300"
                        : "border border-gray-200"
                    }`}
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full ${getAvatarBg(msg.senderName)} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      isOrganizer
                        ? "ring-1.5 ring-blue-300"
                        : ""
                    }`}
                  >
                    {initials}
                  </div>
                )}

                {/* Mesaj Balonu */}
                <div
                  className={`max-w-[80%] rounded-2xl p-3 text-xs space-y-1.5 ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-white text-gray-800 border border-gray-100 rounded-tl-xs shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold truncate ${isMe ? "text-blue-100" : "text-gray-900"}`}>
                        {msg.senderName}
                      </span>

                      {/* Sade, yumuşak/pastel tonlu etiket: Önce Organizatör, değilse Katılımcı */}
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 select-none ${
                          isMe
                            ? isOrganizer
                              ? "bg-white/25 text-white"
                              : "bg-white/15 text-blue-100"
                            : isOrganizer
                            ? "bg-blue-50 text-blue-700 border border-blue-100"
                            : "bg-gray-100 text-gray-600 border border-gray-200/70"
                        }`}
                      >
                        {isOrganizer
                          ? t("Event_BadgeOrganizer") || "Organizatör"
                          : t("Event_BadgeParticipant") || "Katılımcı"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] shrink-0 font-medium ${
                          isMe ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {formatMessageTime(msg.createdAt, i18n.language)}
                      </span>
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap break-words leading-relaxed font-normal">
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mesaj Gönderme / Kısıtlama Alanı (Chat Bar) */}
      {canPostMessage ? (
        <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("Event_ChatPlaceholder") || "Bir yorum veya mesaj yaz..."}
            disabled={isSending}
            maxLength={1000}
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-400 transition-all font-medium placeholder:text-gray-400 disabled:opacity-60 shadow-xs"
          />
          <button
            type="submit"
            disabled={!content.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 font-bold p-3 rounded-2xl transition-all shrink-0 flex items-center justify-center shadow-md shadow-blue-600/20 disabled:shadow-none"
            title={t("Event_ChatSend") || "Gönder"}
          >
            {isSending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </form>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-50 border border-gray-200/80 rounded-2xl text-gray-600 text-xs font-semibold text-center select-none shadow-xs">
          <Lock size={15} className="shrink-0 text-gray-400" />
          <span>
            {t("Event_ChatJoinRequired") || "Yorum yazabilmek için önce etkinliğe katılmalısınız."}
          </span>
        </div>
      )}
    </div>
  );
}
