import { useEffect, useState } from "react";
import { adminApi } from "./adminApi";
import type { AdminEvent, AdminFeedback, AdminUser, EventStatistics } from "./adminApi";

export interface AdminStoreState {
  stats: EventStatistics;
  users: AdminUser[];
  feedbacks: AdminFeedback[];
  events: AdminEvent[];
  loading: boolean;
  error: string;
}

const defaultStats: EventStatistics = {
  totalCreatedEvents: 0,
  activeEvents: 0,
  pendingEvents: 0,
};

let state: AdminStoreState = {
  stats: { ...defaultStats },
  users: [],
  feedbacks: [],
  events: [],
  loading: false,
  error: "",
};

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const adminStore = {
  getState: () => state,

  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  refresh: async () => {
    state = { ...state, loading: true, error: "" };
    notify();

    try {
      const [statistics, userList, feedbackList] = await Promise.all([
        adminApi.getStatistics().catch(() => state.stats),
        adminApi.getUsers().catch(() => state.users),
        adminApi.getFeedbacks().catch(() => state.feedbacks),
      ]);

      state = {
        ...state,
        stats: statistics,
        users: userList,
        feedbacks: feedbackList,
        loading: false,
      };
      notify();
    } catch (e: any) {
      state = {
        ...state,
        loading: false,
        error: e?.message ?? "Error refreshing admin store",
      };
      notify();
    }
  },

  setFeedbacks: (feedbacks: AdminFeedback[]) => {
    state = { ...state, feedbacks };
    notify();
  },

  resolveFeedback: (id: string) => {
    state = {
      ...state,
      feedbacks: state.feedbacks.map((f) =>
        f.id === id ? { ...f, isResolved: true } : f
      ),
    };
    notify();
  },

  setUsers: (users: AdminUser[]) => {
    state = { ...state, users };
    notify();
  },

  updateUserStatus: (id: string, isActive: boolean) => {
    state = {
      ...state,
      users: state.users.map((u) => (u.id === id ? { ...u, isActive } : u)),
    };
    notify();
  },

  updateUserRole: (id: string, role: string | number) => {
    state = {
      ...state,
      users: state.users.map((u) => (u.id === id ? { ...u, role } : u)),
    };
    notify();
  },

  setEvents: (events: AdminEvent[]) => {
    state = { ...state, events };
    notify();
  },

  approveEvent: (id: string) => {
    const prevPending = state.stats.pendingEvents;
    const prevActive = state.stats.activeEvents;

    state = {
      ...state,
      stats: {
        ...state.stats,
        pendingEvents: Math.max(0, prevPending - 1),
        activeEvents: prevActive + 1,
      },
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "approved" } : e
      ),
    };
    notify();

    // Arka planda istatistikleri ve etkinlikleri sunucudan yeniden doğrula
    void adminApi
      .getStatistics()
      .then((newStats) => {
        state = { ...state, stats: newStats };
        notify();
      })
      .catch(() => {});
  },

  rejectEvent: (id: string, reason?: string) => {
    const prevPending = state.stats.pendingEvents;

    state = {
      ...state,
      stats: {
        ...state.stats,
        pendingEvents: Math.max(0, prevPending - 1),
      },
      events: state.events.map((e) =>
        e.id === id ? { ...e, status: "rejected", rejectionReason: reason } : e
      ),
    };
    notify();

    // Arka planda istatistikleri ve etkinlikleri sunucudan yeniden doğrula
    void adminApi
      .getStatistics()
      .then((newStats) => {
        state = { ...state, stats: newStats };
        notify();
      })
      .catch(() => {});
  },
};

export function useAdminStore() {
  const [storeState, setStoreState] = useState<AdminStoreState>(adminStore.getState());

  useEffect(() => {
    return adminStore.subscribe(() => {
      setStoreState(adminStore.getState());
    });
  }, []);

  return storeState;
}
