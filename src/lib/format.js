export function formatCurrency(amount) {
  const n = Number(amount) || 0;
  return n.toLocaleString("th-TH", { style: "currency", currency: "THB" });
}

export function formatDate(date, opts = {}) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(date) {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** yyyy-MM-dd, timezone-safe (avoids UTC off-by-one from toISOString). */
export function toISODate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(toISODate(checkIn));
  const b = new Date(toISODate(checkOut));
  const diff = Math.round((b - a) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

// [เพิ่มใหม่] คอลัมน์ active ในชีต (room_types, rooms, users) อาจเป็น checkbox
// จริง (boolean) หรือข้อความ "TRUE"/"FALSE" ก็ได้ — เทียบแบบเดียวกับ isTrue() ฝั่ง
// gas/Code.gs กัน !!"FALSE" ที่เป็น string ไม่ว่างแล้วกลาย true ผิดๆ
export function isActiveValue(v) {
  if (typeof v === "boolean") return v;
  return String(v ?? "").trim().toUpperCase() === "TRUE";
}

// [เพิ่มใหม่] room_types.photo_urls ในชีตเก็บเป็นสตริงเดียว (คั่นด้วย comma หรือ
// ขึ้นบรรทัดใหม่) ไม่ใช่ array ของ backend ที่ไหน — แปลงเป็น array URL ที่ใช้แสดงผลได้
export function parsePhotoUrls(photoUrls) {
  if (!photoUrls) return [];
  return String(photoUrls)
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
