"use client";

import { jsPDF } from "jspdf";
import { formatDateTime } from "./format";
import { formatGeoStamp } from "./geo";

/**
 * Build a check-in / check-out document as a PDF and return it as a base64
 * data URL, ready to send to GAS (`saveProcessPdf`) for storage in Drive.
 *
 * @param {"checkin"|"checkout"} docType
 * @param {object} data
 * @param {object} data.booking - { bookingId, guestName, roomTypeName, checkIn, checkOut }
 * @param {string} [data.keyPhotoDataUrl] - photo of the key, as data URL
 * @param {string} data.signatureDataUrl - signature PNG, as data URL
 * @param {{lat:number,lng:number}|null} data.geo
 * @param {string} [data.signedBy] - name of the signer (guest or admin)
 */
export function buildProcessPdf(docType, data) {
  const { booking, keyPhotoDataUrl, signatureDataUrl, geo, signedBy } = data;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const title = docType === "checkin" ? "เอกสารรับกุญแจ (Check-in)" : "เอกสารคืนกุญแจ (Check-out)";
  const now = new Date();

  doc.setFontSize(18);
  doc.text(title, 40, 50);

  doc.setFontSize(11);
  const lines = [
    `เลขที่การจอง: ${booking?.bookingId ?? "-"}`,
    `ผู้เข้าพัก: ${booking?.guestName ?? "-"}`,
    `ประเภทห้อง: ${booking?.roomTypeName ?? "-"}`,
    `เช็คอิน: ${booking?.checkIn ?? "-"}   เช็คเอาท์: ${booking?.checkOut ?? "-"}`,
    `ผู้เซ็นเอกสาร: ${signedBy ?? "-"}`,
    `วันเวลาที่เซ็น: ${formatDateTime(now)}`,
    formatGeoStamp(geo),
  ];
  lines.forEach((line, i) => doc.text(line, 40, 80 + i * 20));

  let cursorY = 80 + lines.length * 20 + 20;

  if (keyPhotoDataUrl) {
    doc.setFontSize(13);
    doc.text("รูปกุญแจ", 40, cursorY);
    cursorY += 10;
    try {
      doc.addImage(keyPhotoDataUrl, "JPEG", 40, cursorY, 220, 165, undefined, "FAST");
    } catch {
      doc.addImage(keyPhotoDataUrl, "PNG", 40, cursorY, 220, 165, undefined, "FAST");
    }
    cursorY += 185;
  }

  doc.setFontSize(13);
  doc.text("ลายเซ็น", 40, cursorY);
  cursorY += 10;
  if (signatureDataUrl) {
    doc.addImage(signatureDataUrl, "PNG", 40, cursorY, 220, 100, undefined, "FAST");
    cursorY += 110;
  }

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `สร้างโดยระบบอัตโนมัติ • ${formatDateTime(now)} • ${formatGeoStamp(geo)}`,
    40,
    810
  );

  return doc.output("datauristring"); // data:application/pdf;base64,....
}
