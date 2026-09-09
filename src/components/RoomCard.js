import Image from "next/image";
import Link from "next/link";
import { formatCurrency, parsePhotoUrls } from "@/lib/format";

export default function RoomCard({ room }) {
  const coverImage = parsePhotoUrls(room.photo_urls)[0];

  return (
    <Link
      href={`/rooms/${room.type_id}`}
      className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-48 w-full bg-stone-200">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={room.type_name}
            fill
            unoptimized
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">ไม่มีรูป</div>
        )}
        {/* [แก้] ของเดิมโชว์ "ว่าง/เต็ม" ตรงนี้ แต่ backend (getRoomTypes) ไม่ได้คืนจำนวน
            ห้องว่างมาด้วย — ต้องเลือกวันที่ก่อนถึงจะเช็คว่างได้จริง (checkAvailability)
            เลยโชว์แค่จำนวนห้องทั้งหมดในระบบแทน ไปดูห้องว่างจริงในหน้ารายละเอียด */}
        {room.total_rooms > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-stone-800/80 px-2 py-1 text-xs font-semibold text-white">
            มีทั้งหมด {room.total_rooms} ห้อง
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-800">{room.type_name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{room.description}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-teal-700">{formatCurrency(room.price_weekday)}</span>
          <span className="text-xs text-stone-400">/ คืน (วันธรรมดา)</span>
        </div>
      </div>
    </Link>
  );
}
