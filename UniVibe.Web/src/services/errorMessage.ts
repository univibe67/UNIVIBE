import i18n from "../i18n";

interface ErrorResponse {
  status?: number;
  data?: unknown;
}

interface ErrorLike {
  message?: unknown;
  userMessage?: unknown;
  response?: ErrorResponse;
  code?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const formatValidationErrors = (errors: unknown): string | null => {
  if (Array.isArray(errors)) {
    const messages = errors
      .flatMap((error) => (Array.isArray(error) ? error : [error]))
      .filter((error): error is string => typeof error === "string" && error.trim() !== "");
    return messages.length ? messages.join(" • ") : null;
  }

  if (isRecord(errors)) {
    const messages = Object.values(errors)
      .flatMap((error) => (Array.isArray(error) ? error : [error]))
      .filter((error): error is string => typeof error === "string" && error.trim() !== "");
    return messages.length ? messages.join(" • ") : null;
  }

  return typeof errors === "string" && errors.trim() !== "" ? errors : null;
};

const translateBackendMessage = (message: string): string => {
  const rawMessage = message.trim();
  if (!rawMessage) return message;

  const candidates = rawMessage.startsWith("errors.")
    ? [rawMessage]
    : [rawMessage, `errors.${rawMessage}`];

  const translationKey = candidates.find((candidate) => i18n.exists(candidate));
  return translationKey ? i18n.t(translationKey) : message;
};

export function getErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim() !== "") {
    return translateBackendMessage(error);
  }

  const errorLike = isRecord(error) ? (error as ErrorLike) : {};
  const response = errorLike.response;
  const data = response?.data;
  const body = isRecord(data) ? data : null;

  const directMessage = body?.message ?? body?.Message;
  if (typeof directMessage === "string" && directMessage.trim() !== "") {
    return translateBackendMessage(directMessage);
  }

  const problemDetailsMessage = body?.detail ?? body?.title;
  if (typeof problemDetailsMessage === "string" && problemDetailsMessage.trim() !== "") {
    return translateBackendMessage(problemDetailsMessage);
  }

  const validationMessage = formatValidationErrors(body?.errors);
  if (validationMessage) {
    return validationMessage
      .split(" • ")
      .map(translateBackendMessage)
      .join(" • ");
  }

  if (typeof data === "string" && data.trim() !== "") {
    return translateBackendMessage(data);
  }

  if (typeof errorLike.userMessage === "string" && errorLike.userMessage.trim() !== "") {
    return translateBackendMessage(errorLike.userMessage);
  }

  if (typeof errorLike.message === "string" && errorLike.message.trim() !== "" &&
      !/^request failed with status code \d+$/i.test(errorLike.message)) {
    return translateBackendMessage(errorLike.message);
  }

  if (response?.status === 429) {
    return "Çok fazla istek gönderdiniz, lütfen biraz bekleyin.";
  }

  if (response?.status && response.status >= 500) {
    return "Sunucuda bir sorun oluştu, lütfen daha sonra tekrar deneyin.";
  }

  if (response?.status === 401) {
    return "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.";
  }

  if (!response || errorLike.code === "ERR_NETWORK") {
    return "Sunucuya ulaşılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.";
  }

  return "İşlem sırasında beklenmeyen bir hata oluştu.";
}
