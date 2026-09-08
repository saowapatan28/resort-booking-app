"use client";

import { useRef, useState } from "react";

/** Generic camera/file capture box, used for the key photo at check-in. */
export default function CameraCapture({ label = "ถ่ายรูปกุญแจ", onCapture, dataUrl }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(dataUrl || null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      onCapture?.(reader.result, file);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-600">{label}</label>
      <div
        className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 p-3 text-center text-sm text-stone-500 hover:border-teal-500"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="key" className="max-h-56 rounded object-contain" />
        ) : (
          <span>📷 แตะเพื่อถ่ายรูป / เลือกรูป</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
