import { useSyncExternalStore } from "react";
import { api } from "./api";
import { unwrap } from "./unwrap";

export interface CurrentUser {
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePictureUrl?: string;
}

let user: CurrentUser | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export const currentUser = {
  load: async () => {
    try {
      user = unwrap<CurrentUser>(await api.get("/users/profile/me")) ?? null;
      emit();
    } catch (error) {
      console.error("Kullanıcı bilgisi alınamadı:", error);
    }
  },
  patch: (changes: Partial<CurrentUser>) => {
    user = user ? { ...user, ...changes } : changes;
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useCurrentUser(): CurrentUser | null {
  return useSyncExternalStore(subscribe, () => user);
}

export function displayNameOf(value: CurrentUser | null): string {
  return [value?.firstName, value?.lastName].filter(Boolean).join(" ");
}
