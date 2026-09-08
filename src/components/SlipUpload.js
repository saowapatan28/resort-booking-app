"use client";

import { useRef, useState } from "react";

export default function SlipUpload({ file, onChange, label = "อัพโหลดสลิปการโอนเงิน" }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  function handleFile(f) {
    onChange(f || null);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview(null);
  }

  return (
    <div>
      <label className="mb-1 block text-sm text-stone-600">{label}</label>
      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-stone-300 p-4 text-center text-sm text-stone-500 hover:border-teal-500"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="slip preview" className="mb-2 max-h-48 rounded" />
        ) : (
          <span>📎 แตะเพื่อเลือกรูปสลิป (jpg, png)</span>
        )}
        {file && <span className="mt-1 text-xs text-stone-400">{file.name}</span>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
