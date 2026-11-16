export interface FilterableEvent {
  id?: string;
  title?: string;
  eventDate?: string;
  status?: string | number | null;
  isActive?: boolean;
  isDeleted?: boolean;
}

/**
 * Bir etkinliğin onaylanmış (Approved / aktif statüde) olup olmadığını kontrol eder.
 * Onaylanmış etkinlikler: status === 2 veya "approved", "onaylandi", "onaylandı".
 * Taslak (draft), onay bekleyen (Pending - 1), reddedilmiş (Rejected - 3),
 * iptal edilmiş (Cancelled - 4) veya tamamlanmış (Completed - 5) etkinlikler onaylanmış sayılmaz.
 */
export function isEventApproved(status?: string | number | null): boolean {
  if (status === null || status === undefined) return false;
  if (status === 2) return true;

  const s = String(status).trim().toLowerCase();
  return (
    s === "2" ||
    s === "approved" ||
    s === "onaylandi" ||
    s === "onaylandı" ||
    s === "active" ||
    s === "aktif"
  );
}

/**
 * Bir etkinliğin tarihinin şu anki zamandan ileri bir tarihte (gelecekte) olup olmadığını kontrol eder.
 * Tarihi geçmiş veya şu anki zamandan önce/aynı olan etkinlikler elenir.
 */
export function isEventInFuture(eventDate?: string | null): boolean {
  if (!eventDate) return false;
  const eventTime = new Date(eventDate).getTime();
  if (isNaN(eventTime)) return false;
  return eventTime > Date.now();
}

/**
 * Ana sayfa banner sayacı ve "Senin için etkinlikler" listesi için
 * aktif ve katılınabilir etkinlik koşullarının tamamını denetler:
 * 1. Etkinlik onaylanmış (Approved / aktif statüde) olmalı; taslak, onay bekleyen (Pending) veya reddedilmiş (Rejected) etkinlikler sayılmamalı.
 * 2. Etkinliğin tarihi/saati şu anki zamandan ileri bir tarihte olmalı (tarihi geçmiş etkinlikler sayılmamalı).
 * 3. Sayfa altındaki "Senin için etkinlikler" listesinde kullanılan aktif/katılınabilir etkinlik filtreleme mantığıyla birebir uyumludur.
 */
export function isEventActiveAndJoinable(event?: FilterableEvent | null): boolean {
  if (!event) return false;

  // Silinmiş veya açıkça pasif olarak işaretlenmiş etkinlikleri filtrele
  if (event.isDeleted) return false;
  if (event.isActive === false) return false;

  const rawStatus = event.status;
  const statusStr = String(rawStatus ?? "").trim().toLowerCase();

  // Taslak, onay bekleyen (Pending), reddedilmiş (Rejected), iptal veya tamamlanmış etkinlikleri dışla
  if (
    rawStatus === 1 || // Pending
    rawStatus === 3 || // Rejected
    rawStatus === 4 || // Cancelled
    rawStatus === 5 || // Completed
    statusStr === "pending" ||
    statusStr === "bekliyor" ||
    statusStr === "onay bekliyor" ||
    statusStr === "rejected" ||
    statusStr === "reddedildi" ||
    statusStr === "cancelled" ||
    statusStr === "canceled" ||
    statusStr === "iptal" ||
    statusStr === "iptal edildi" ||
    statusStr === "draft" ||
    statusStr === "taslak" ||
    statusStr === "completed" ||
    statusStr === "tamamlandi" ||
    statusStr === "tamamlandı"
  ) {
    return false;
  }

  // 1. Koşul: Onaylanmış (Approved / aktif statüde) olmalı
  if (!isEventApproved(rawStatus)) {
    return false;
  }

  // 2. Koşul: Etkinliğin tarihi/saati şu anki zamandan ileri bir tarihte olmalı
  if (!isEventInFuture(event.eventDate)) {
    return false;
  }

  return true;
}
