"use client";

import { formatDateTime } from "./format";
import { formatGeoStamp } from "./geo";

/**
 * Draw a timestamp + GPS stamp on top of a raw signature image and return the
 * merged image as a PNG data URL. Runs entirely client-side via <canvas>.
 *
 * @param {string} signatureDataUrl - PNG data URL from SignaturePad
 * @param {{lat:number,lng:number}|null} geo
 * @param {string} [signedBy]
 */
export function stampSignature(signatureDataUrl, geo, signedBy) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const padding = 28;
      canvas.width = img.width;
      canvas.height = img.height + padding;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const stamp = `${formatDateTime(new Date())} · ${formatGeoStamp(geo)}${
        signedBy ? ` · ${signedBy}` : ""
      }`;
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#475569";
      ctx.fillText(stamp, 6, canvas.height - 8);

      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = signatureDataUrl;
  });
}
