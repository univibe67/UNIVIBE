import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";
import { getErrorMessage } from "../services/errorMessage";
import { toast } from "../services/toast";
import { unwrap } from "../services/unwrap";
import type { EventItem, EventRoleFlags } from "../types/event";

interface UseEventDialogsOptions {
  onChanged?: () => void | Promise<void>;
  closeDetailOnLeave?: boolean;
}

function mergeEvent(item: EventItem, fetched: EventItem, flags?: EventRoleFlags): EventItem {
  return {
    ...item,
    ...fetched,
    isJoined: flags?.isJoined ?? fetched.isJoined ?? item.isJoined,
    isCreator: flags?.isCreator ?? fetched.isCreator ?? item.isCreator,
  };
}

export function useEventDialogs({ onChanged, closeDetailOnLeave = false }: UseEventDialogsOptions = {}) {
  const { t } = useTranslation();
  const [detail, setDetail] = useState<EventItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [chat, setChat] = useState<EventItem | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const detailRequest = useRef(0);
  const chatRequest = useRef(0);

  const openDetail = useCallback(async (item: EventItem, flags?: EventRoleFlags) => {
    const requestId = ++detailRequest.current;
    setDetail({ ...item, ...flags });
    setDetailLoading(true);
    try {
      const fetched = unwrap<EventItem>(await api.get(`/events/${item.id}`));
      if (requestId === detailRequest.current && fetched?.id) {
        setDetail(mergeEvent(item, fetched, flags));
      }
    } catch (error) {
      console.error("Etkinlik detayı yüklenemedi:", error);
    } finally {
      if (requestId === detailRequest.current) setDetailLoading(false);
    }
  }, []);

  const openComments = useCallback(async (item: EventItem, flags?: EventRoleFlags) => {
    const requestId = ++chatRequest.current;
    setChat({ ...item, ...flags });
    try {
      const fetched = unwrap<EventItem>(await api.get(`/events/${item.id}`));
      if (requestId === chatRequest.current && fetched?.id) {
        setChat(mergeEvent(item, fetched, flags));
      }
    } catch (error) {
      console.error("Sohbet için etkinlik bilgisi yüklenemedi:", error);
    }
  }, []);

  const applyJoined = (eventId: string, isJoined: boolean) => {
    setDetail((current) => (current?.id === eventId ? { ...current, isJoined } : current));
    setChat((current) => (current?.id === eventId ? { ...current, isJoined } : current));
  };

  const join = async (eventId: string) => {
    setJoining(true);
    try {
      await api.post(`/events/${eventId}/attendees`);
      applyJoined(eventId, true);
      toast.success(t("Student_JoinSuccess"));
      void onChanged?.();
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        applyJoined(eventId, true);
        toast.success(t("Student_AlreadyJoinedNotice"));
        void onChanged?.();
      } else {
        toast.error(getErrorMessage(error) || t("Student_JoinError"));
      }
    } finally {
      setJoining(false);
    }
  };

  const leave = async (eventId: string) => {
    setLeaving(true);
    try {
      await api.delete(`/events/${eventId}/attendees/me`);
      applyJoined(eventId, false);
      if (closeDetailOnLeave) setDetail(null);
      toast.success(t("Student_LeaveSuccess"));
      void onChanged?.();
    } catch (error) {
      toast.error(getErrorMessage(error) || t("Student_LeaveError"));
    } finally {
      setLeaving(false);
    }
  };

  const closeDetail = () => {
    detailRequest.current += 1;
    setDetail(null);
    setDetailLoading(false);
  };

  const closeChat = () => {
    chatRequest.current += 1;
    setChat(null);
  };

  return {
    openDetail,
    openComments,
    detailProps: {
      event: detail,
      loading: detailLoading,
      joining,
      leaving,
      onClose: closeDetail,
      onJoin: join,
      onLeave: leave,
      onOpenComments: (event: EventItem) => void openComments(event),
    },
    chatProps: { event: chat, onClose: closeChat },
  };
}
