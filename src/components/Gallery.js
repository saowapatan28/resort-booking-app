"use client";

import { useState } from "react";
import Image from "next/image";

// [แก้] ชีต gallery คืนฟิลด์ image_url/gallery_id จาก getGallery() (ไม่ใช่ url/id
// อย่างที่ของเดิมสมมติ) — รองรับทั้งสองชื่อ เผื่อหน้าที่ประกอบ object เองส่ง `url` มาตรงๆ
export default function Gallery({ images = [] }) {
  const [active, setActive] = useState(0);
  const getUrl = (img) => img?.url ?? img?.image_url;
  const getId = (img, i) => img?.id ?? img?.gallery_id ?? i;

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
          src={getUrl(images[active])}
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
              key={getId(img, i)}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-teal-600" : "border-transparent opacity-70"
              }`}
            >
              <Image src={getUrl(img)} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
