"use client";

import { useState } from "react";
import Image from "next/image";

export default function Gallery({ images = [] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-stone-200 text-stone-400">
        ยังไม่มีรูปภาพ
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-72 w-full overflow-hidden rounded-xl bg-stone-200 sm:h-96">
        <Image
          src={images[active]?.url}
          alt={images[active]?.caption || "resort"}
          fill
          className="object-cover"
          unoptimized
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-teal-600" : "border-transparent opacity-70"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
