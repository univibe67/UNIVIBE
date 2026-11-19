export function unwrap<T>(response: unknown): T {
  const value = response as { data?: { data?: unknown } | unknown } | null | undefined;
  const inner = value?.data as { data?: unknown } | undefined;
  return (inner?.data || value?.data || response) as T;
}
