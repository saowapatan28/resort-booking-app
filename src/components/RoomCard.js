import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

export default function RoomCard({ room }) {
  const available = room.availableCount ?? 0;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="relative h-48 w-full bg-stone-200">
        {room.coverImage ? (
          <Image
            src={room.coverImage}
            alt={room.name}
            fill
            unoptimized
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400">ไม่มีรูป</div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
            available > 0 ? "bg-emerald-600 text-white" : "bg-stone-500 text-white"
          }`}
        >
          {available > 0 ? `ว่าง ${available} ห้อง` : "ห้องเต็ม"}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-stone-800">{room.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-stone-500">{room.description}</p>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-lg font-bold text-teal-700">{formatCurrency(room.basePrice)}</span>
          <span className="text-xs text-stone-400">/ คืน</span>
        </div>
      </div>
    </Link>
  );
}
