export type ToastTone = "success" | "error";

export interface ToastItem {
  id: number;
  tone: ToastTone;
  text: string;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function dismiss(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(tone: ToastTone, text: string) {
  const id = nextId++;
  items = [...items.slice(-2), { id, tone, text }];
  emit();
  window.setTimeout(() => dismiss(id), 5000);
}

export const toast = {
  success: (text: string) => push("success", text),
  error: (text: string) => push("error", text),
  dismiss,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getItems: () => items,
};
