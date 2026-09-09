"use client";

import { getSession } from "./auth";

/**
 * Call a GAS backend action through our own /api/gas proxy.
 * Automatically attaches the logged-in admin/owner token when present.
 *
 * @param {string} action - one of GAS_ACTIONS in lib/constants.js
 * @param {object} [payload] - action-specific data
 * @returns {Promise<any>} the `data` field from a successful GAS response
 */
export async function callGas(action, payload = {}) {
  const session = getSession();

  // สำคัญ: backend จริง (gas/Code.gs) รับฟิลด์แบบแบนๆ ที่ระดับบนสุดคู่กับ action
  // (เช่น { action: "login", username, password }) ไม่ได้ห่อไว้ใน payload ซ้อนอีกชั้น
  const res = await fetch("/api/gas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...payload,
      token: session?.token,
    }),
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error("การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว (invalid response)");
  }

  if (!res.ok || !json.ok) {
    throw new Error(json?.error || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
  }

  // backend เวอร์ชันจริงตอบกลับ 2 แบบปนกัน: บาง action ห่อผลลัพธ์ไว้ใน `data`
  // (เช่น getRoomTypes) บาง action คืนฟิลด์แบนๆ ตรงๆ (เช่น login คืน token/role ตรงๆ)
  // เช็คทั้งสองแบบไว้ กันพังทั้งสองฝั่ง
  if (json.data !== undefined) return json.data;
  const { ok, ...rest } = json;
  return rest;
}

/** Convert a File/Blob to a base64 data URL (used for image previews). */
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File/Blob to the raw base64 payload gas/Code.gs expects
 * (`file_base64` / `key_photo_base64` / `signature_base64` / `pdf_base64`).
 * Unlike fileToDataUrl this strips the `data:<mime>;base64,` prefix — Code.gs
 * passes the string straight into Utilities.base64Decode(), which chokes on
 * that prefix — and returns the mime type alongside it.
 */
export async function fileToBase64(file) {
  const dataUrl = await fileToDataUrl(file);
  const [, mimeType = file.type, base64 = ""] =
    dataUrl.match(/^data:([^;]+);base64,(.*)$/s) || [];
  return { base64, mimeType };
}

/** Strip the `data:<mime>;base64,` prefix off a data URL string. */
export function dataUrlToBase64(dataUrl) {
  return dataUrl.split(",")[1] || "";
}
