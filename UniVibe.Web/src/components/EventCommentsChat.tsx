import { useState, useEffect, useRef } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";
import { MessageCircle, Send, Lock, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18next from "../i18n";
import { tokenService } from "../services/tokenService";
import { getErrorMessage } from "../services/errorMessage";
import {
  getEventChatHubUrl,
  getEventMessages,
  sendEventMessageHttp,
  type EventMessageItem,
} from "../services/eventChatService";
import Alert from "./ui/Alert";
import Avatar from "./ui/Avatar";
import Button from "./ui/Button";
import { controlClass } from "./ui/fieldStyles";

interface EventCommentsChatProps {
  eventId: string;
  event?: any;
  isJoined?: boolean;
  isCreator?: boolean;
  creatorId?: string;
  className?: string;
}

function formatMessageTime(
  dateString: string,
  currentLang: string = "tr",
): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString(
      currentLang.startsWith("en") ? "en-US" : "tr-TR",
      {
        hour: "2-digit",
        minute: "2-digit",
      },
    );

    if (isToday) {
      return timeStr;
    }

    const dateStr = d.toLocaleDateString(
      currentLang.startsWith("en") ? "en-US" : "tr-TR",
      {
        day: "numeric",
        month: "short",
      },
    );

    return `${dateStr}, ${timeStr}`;
  } catch {
    return "";
  }
}

export default function EventCommentsChat({
  eventId,
  event,
  isJoined,
  isCreator,
  creatorId,
  className = "",
}: EventCommentsChatProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<EventMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const connectionRef = useRef<HubConnection | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Giriş yapan kullanıcının kimliği
  const currentUserId = tokenService.getUserId();

  const effectiveCreatorId =
    creatorId ??
    event?.creatorId ??
    event?.createdById ??
    event?.organizerId ??
    event?.userId ??
    (isCreator && currentUserId ? currentUserId : undefined);

  // 1. Etkinliğe katılmış olan kullanıcılar (joined / participant)
  const isJoinedUser = Boolean(isJoined);

  // 2. Etkinliği oluşturan kullanıcı (creator / organizer)
  const isCreatorUser = Boolean(
    isCreator ||
    (creatorId &&
      currentUserId &&
      creatorId.toLowerCase() === currentUserId.toLowerCase()),
  );

  // canAccessChat: Kimler mesajları okuyabilir ve SignalR'a bağlanabilir?
  // Backend kuralı (EventMessageService): Yalnızca etkinliğe katılmış olanlar (isAttendee) veya oluşturan organizatör (isCreator).
  // Admin dahi olsa etkinliğe katılmamışsa backend 403 Forbidden döner; bu sebeple yalnızca katılmış veya organizatör olanlar erişebilir.
  const canAccessChat = isJoinedUser || isCreatorUser;

  // canPostMessage: Yalnızca etkinliğe katılmış olan veya organizatör olan kullanıcılar mesaj yazabilir
  // (Admin dahi olsa backend kuralı gereği etkinliğe katılmamışsa mesaj gönderemez)
  const canPostMessage = isJoinedUser || isCreatorUser;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        setMessages(sorted);
      })
      .catch((err) => {
        // Kullanıcı etkinliğe katılmamışsa backend 403 dönebilir
        console.warn(
          "Geçmiş mesajlar yüklenirken bilgi:",
          getErrorMessage(err),
        );
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
        id: String(
          rawMessage?.id ?? rawMessage?.Id ?? `${Date.now()}-${Math.random()}`,
        ),
        eventId: String(rawMessage?.eventId ?? rawMessage?.EventId ?? eventId),
        userId: String(rawMessage?.userId ?? rawMessage?.UserId ?? ""),
        senderName: String(
          rawMessage?.senderName ?? rawMessage?.SenderName ?? "Katılımcı",
        ),
        senderProfileImage:
          rawMessage?.senderProfileImage ??
          rawMessage?.SenderProfileImage ??
          null,
        content: String(rawMessage?.content ?? rawMessage?.Content ?? ""),
        createdAt: String(
          rawMessage?.createdAt ??
            rawMessage?.CreatedAt ??
            new Date().toISOString(),
        ),
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
      setChatError(errorMessage || i18next.t("UI_ChatError"));
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
        setMessages((prev) =>
          prev.some((m) => m.id === sent.id) ? prev : [...prev, sent],
        );
        setContent("");
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      const msgLower = (msg || "").toLowerCase();
      if (!msgLower.includes("accessdenied") && !msgLower.includes("yetki")) {
        setChatError(msg || t("UI_ChatSendError"));
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

  const visibleError =
    chatError &&
    !chatError.toLowerCase().includes("accessdenied") &&
    !chatError.toLowerCase().includes("yetki")
      ? chatError
      : null;

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {visibleError && <Alert>{visibleError}</Alert>}

      <div
        className="h-[46dvh] max-h-[420px] min-h-56 space-y-4 overflow-y-auto rounded-xl bg-ink-50 p-3.5"
        aria-live="polite"
        aria-label={t("Event_CommentsTitle")}
        tabIndex={0}
      >
        {isLoading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-500">
            <Loader2 size={22} className="animate-spin text-brand-600" aria-hidden="true" />
            <span className="text-[13px]">{t("Event_ChatLoading")}</span>
          </div>
        ) : (messages?.length ?? 0) === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-ink-500">
            <MessageCircle size={26} strokeWidth={1.5} className="text-ink-400" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed">
              {canPostMessage ? t("Event_NoCommentsYet") : t("Event_ChatJoinRequired")}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = Boolean(
              currentUserId &&
              msg.userId &&
              msg.userId.toLowerCase() === currentUserId.toLowerCase(),
            );

            const isOrganizer = Boolean(
              effectiveCreatorId &&
              msg.userId &&
              msg.userId.toLowerCase() === effectiveCreatorId.toLowerCase(),
            );

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                <Avatar name={msg.senderName} src={msg.senderProfileImage} className="size-8 text-[11px]" />
                <div className={`flex max-w-[78%] min-w-0 flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div className={`mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-1 ${isMe ? "justify-end" : ""}`}>
                    <span className="text-xs font-semibold text-ink-800">{msg.senderName}</span>
                    {isOrganizer && (
                      <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] leading-none font-semibold text-brand-800">
                        {t("Event_BadgeOrganizer")}
                      </span>
                    )}
                    <time dateTime={msg.createdAt} className="text-[11px] text-ink-500">
                      {formatMessageTime(msg.createdAt, i18n.language)}
                    </time>
                  </div>
                  <p
                    className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap ${
                      isMe
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md border border-ink-200/70 bg-white text-ink-800"
                    }`}
                  >
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {canPostMessage ? (
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("Event_ChatPlaceholder")}
            aria-label={t("Event_ChatPlaceholder")}
            disabled={isSending}
            maxLength={1000}
            className={`h-11 flex-1 px-3.5 ${controlClass}`}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!content.trim()}
            loading={isSending}
            aria-label={t("Event_ChatSend")}
            title={t("Event_ChatSend")}
          >
            {!isSending && <Send size={17} aria-hidden="true" />}
          </Button>
        </form>
      ) : (
        <p className="flex items-center justify-center gap-2 rounded-xl bg-ink-100 px-4 py-3 text-center text-[13px] font-medium text-ink-600">
          <Lock size={15} className="shrink-0" aria-hidden="true" />
          {t("Event_ChatJoinRequired")}
        </p>
      )}
    </div>
  );
}
