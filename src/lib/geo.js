"use client";

/** Resolve the browser's current GPS position (used to stamp signatures). */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000, ...options }
    );
  });
}

export function formatGeoStamp(geo) {
  if (!geo) return "GPS: ไม่ทราบตำแหน่ง";
  return `GPS: ${geo.lat.toFixed(5)}, ${geo.lng.toFixed(5)}`;
}

// [เพิ่มใหม่] gas/Code.gs เก็บ gps เป็นค่าเดียวในเซลล์ชีต (checkin_gps/checkout_gps)
// ส่ง object {lat,lng} ตรงๆ ไปจะเซฟเป็น "[object Object]" — ต้องแปลงเป็นสตริงก่อน
export function formatGeoValue(geo) {
  if (!geo) return "";
  return `${geo.lat},${geo.lng}`;
}
