export function localeOf(language?: string): string {
  return (language ?? "tr").toLowerCase().startsWith("en") ? "en-US" : "tr-TR";
}

function parse(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value: string | null | undefined, language?: string): string {
  const date = parse(value);
  if (!date) return "-";
  return date.toLocaleString(localeOf(language), { dateStyle: "long", timeStyle: "short" });
}

export function formatDate(value: string | null | undefined, language?: string): string {
  const date = parse(value);
  if (!date) return "-";
  return date.toLocaleDateString(localeOf(language), { day: "numeric", month: "short", year: "numeric" });
}

export function formatCardDate(value: string | null | undefined, language?: string): string {
  const date = parse(value);
  if (!date) return "-";
  return date.toLocaleString(localeOf(language), { weekday: "long", hour: "2-digit", minute: "2-digit" });
}

export function dateParts(value: string | null | undefined, language?: string) {
  const date = parse(value);
  if (!date) return null;
  return {
    day: date.toLocaleDateString(localeOf(language), { day: "numeric" }),
    month: date.toLocaleDateString(localeOf(language), { month: "short" }),
  };
}
