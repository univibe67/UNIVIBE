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
  name?: string;
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

const isTechnicalError = (msg: string): boolean => {
  const lower = msg.toLowerCase();
  return (
    lower.includes("timeout") ||
    lower.includes("network error") ||
    lower.includes("failed with status code") ||
    lower.includes("failed to fetch") ||
    lower.includes("axioserror") ||
    lower.includes("econnrefused") ||
    lower.includes("econnaborted") ||
    lower.includes("err_network") ||
    lower.includes("etimedout")
  );
};

export const translateKey = (key: string, fallback: string): string => {
  const cleanKey = key.replace(/^errors\./i, "").trim();
  if (cleanKey && i18n.exists(cleanKey)) {
    return i18n.t(cleanKey);
  }
  if (cleanKey && i18n.exists(`errors.${cleanKey}`)) {
    return i18n.t(`errors.${cleanKey}`);
  }
  if (key && i18n.exists(key)) {
    return i18n.t(key);
  }
  return fallback;
};

export const translateBackendMessage = (message: string): string => {
  const rawMessage = (message || "").trim();
  if (!rawMessage) return "";

  const isEn = (i18n.language || "tr").startsWith("en");

  if (isTechnicalError(rawMessage)) {
    if (rawMessage.toLowerCase().includes("timeout") || rawMessage.toLowerCase().includes("econnaborted")) {
      return translateKey(
        "Error_Timeout",
        isEn
          ? "The server did not respond in time, request timed out. Please try again."
          : "Sunucu yanıt vermedi, istek zaman aşımına uğradı. Lütfen tekrar deneyiniz."
      );
    }
    return translateKey(
      "Error_Network",
      isEn
        ? "Unable to connect to the server. Please check your internet connection and verify that the server is running."
        : "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve sunucunun çalıştığını kontrol ediniz."
    );
  }

  // If rawMessage is prefixed with "errors." (e.g. "errors.Error_Timeout")
  if (rawMessage.startsWith("errors.")) {
    const cleanKey = rawMessage.replace(/^errors\./i, "").trim();
    if (i18n.exists(cleanKey)) {
      return i18n.t(cleanKey);
    }
    if (i18n.exists(rawMessage)) {
      return i18n.t(rawMessage);
    }
    if (cleanKey.toLowerCase().includes("timeout")) {
      return isEn
        ? "The server did not respond in time, request timed out. Please try again."
        : "Sunucu yanıt vermedi, istek zaman aşımına uğradı. Lütfen tekrar deneyiniz.";
    }
    if (cleanKey.toLowerCase().includes("network")) {
      return isEn
        ? "Unable to connect to the server. Please check your internet connection."
        : "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve sunucunun çalıştığını kontrol ediniz.";
    }
  }

  // Check if rawMessage is a registered i18n translation key
  const candidates = [
    rawMessage,
    rawMessage.replace(/^errors\./i, ""),
    `errors.${rawMessage.replace(/^errors\./i, "")}`,
  ];
  const foundKey = candidates.find((cand) => cand && i18n.exists(cand));
  if (foundKey) {
    return i18n.t(foundKey);
  }

  // Otherwise, it is a direct backend sentence (e.g. "E-posta veya şifre hatalı.")
  return rawMessage;
};

export function getErrorMessage(error: unknown): string {
  const isEn = (i18n.language || "tr").startsWith("en");

  if (!error) {
    return translateKey(
      "Error_Unexpected",
      isEn
        ? "An unexpected error occurred during the operation."
        : "İşlem sırasında beklenmeyen bir hata oluştu."
    );
  }

  if (typeof error === "string" && error.trim() !== "") {
    return translateBackendMessage(error);
  }

  const errorLike = isRecord(error) ? (error as ErrorLike) : {};
  const code = (typeof errorLike.code === "string" ? errorLike.code : "").toUpperCase();
  const rawMsg = typeof errorLike.message === "string" ? errorLike.message : "";

  // 1. Check for timeout error code or message
  if (
    code === "ECONNABORTED" ||
    code === "ETIMEDOUT" ||
    /timeout.*exceeded/i.test(rawMsg) ||
    rawMsg.toLowerCase().includes("econnaborted")
  ) {
    return translateKey(
      "Error_Timeout",
      isEn
        ? "The server did not respond in time, request timed out. Please try again."
        : "Sunucu yanıt vermedi, istek zaman aşımına uğradı. Lütfen tekrar deneyiniz."
    );
  }

  // 2. Check for network / connection error
  if (
    code === "ERR_NETWORK" ||
    code === "ERR_CONNECTION_REFUSED" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    /network\s*error/i.test(rawMsg) ||
    /failed to fetch/i.test(rawMsg)
  ) {
    return translateKey(
      "Error_Network",
      isEn
        ? "Unable to connect to the server. Please check your internet connection and verify that the server is running."
        : "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve sunucunun çalıştığını kontrol ediniz."
    );
  }

  // 3. Check for canceled request
  if (code === "ERR_CANCELED" || /canceled/i.test(rawMsg)) {
    return "";
  }

  const response = errorLike.response;
  const data = response?.data;
  const body = isRecord(data) ? data : null;

  // 4. Validation errors from backend (ApiResponse.errors or ASP.NET ModelState errors)
  const validationMessage = formatValidationErrors(body?.errors);
  if (validationMessage) {
    return validationMessage
      .split(" • ")
      .map(translateBackendMessage)
      .join(" • ");
  }

  // 5. Direct backend message (ApiResponse.message or direct Message property)
  const directMessage = body?.message ?? body?.Message;
  if (typeof directMessage === "string" && directMessage.trim() !== "") {
    return translateBackendMessage(directMessage);
  }

  // 6. ProblemDetails format (detail or title)
  const problemDetailsMessage = body?.detail ?? body?.title;
  if (typeof problemDetailsMessage === "string" && problemDetailsMessage.trim() !== "") {
    return translateBackendMessage(problemDetailsMessage);
  }

  // 7. Response data as string
  if (typeof data === "string" && data.trim() !== "") {
    return translateBackendMessage(data);
  }

  // 8. Explicit userMessage attached to error
  if (typeof errorLike.userMessage === "string" && errorLike.userMessage.trim() !== "") {
    const translated = translateBackendMessage(errorLike.userMessage);
    if (translated && !isTechnicalError(translated)) {
      return translated;
    }
  }

  // 9. HTTP Status Code Fallbacks
  const status = response?.status;
  if (status === 400) {
    return translateKey(
      "Val_Required",
      isEn
        ? "Invalid request. Please check the entered information."
        : "Geçersiz istek gönderildi. Lütfen girdiğiniz bilgileri kontrol edin."
    );
  }
  if (status === 401) {
    return translateKey(
      "Auth_SessionExpired",
      isEn
        ? "Your session is invalid or has expired. Please log in again."
        : "Oturumunuz geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapınız."
    );
  }
  if (status === 403) {
    return translateKey(
      "Event_UnauthorizedView",
      isEn
        ? "You do not have permission to perform this action."
        : "Bu işlem için yetkiniz bulunmamaktadır."
    );
  }
  if (status === 404) {
    return translateKey(
      "Event_NotFound",
      isEn
        ? "The requested record or page was not found."
        : "İstenen kayıt veya sayfa bulunamadı."
    );
  }
  if (status === 429) {
    return translateKey(
      "Res_RateLimit_TooManyRequests",
      isEn
        ? "Too many requests sent, please wait a moment."
        : "Çok fazla istek gönderdiniz, lütfen biraz bekleyin."
    );
  }
  if (status && status >= 500) {
    return translateKey(
      "Error_InternalServer",
      isEn
        ? "A problem occurred on the server, please try again later."
        : "Sunucuda bir sorun oluştu, lütfen daha sonra tekrar deneyiniz."
    );
  }

  // 10. If there was no response and no status, it's a network issue
  if (!response) {
    return translateKey(
      "Error_Network",
      isEn
        ? "Unable to connect to the server. Please check your internet connection and verify that the server is running."
        : "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı ve sunucunun çalıştığını kontrol ediniz."
    );
  }

  // 11. Non-technical error.message
  if (
    typeof errorLike.message === "string" &&
    errorLike.message.trim() !== "" &&
    !isTechnicalError(errorLike.message)
  ) {
    return translateBackendMessage(errorLike.message);
  }

  return translateKey(
    "Error_Unexpected",
    isEn
      ? "An unexpected error occurred during the operation."
      : "İşlem sırasında beklenmeyen bir hata oluştu."
  );
}
