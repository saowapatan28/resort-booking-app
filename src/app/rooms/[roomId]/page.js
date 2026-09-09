"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import DateRangePicker from "@/components/DateRangePicker";
import BookingForm from "@/components/BookingForm";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency, parsePhotoUrls } from "@/lib/format";

export default function RoomDetailPage() {
  const { roomId: typeId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    // [แก้] getRoomTypes ไม่รับ id มากรอง — ดึงทั้งหมดแล้วหาเอาเองฝั่ง client
    callGas(GAS_ACTIONS.GET_ROOM_TYPES)
      .then((data) => {
        const found = (data ?? []).find((r) => r.type_id === typeId);
        if (!found) throw new Error("ไม่พบห้องพักนี้");
        setRoom(found);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [typeId]);

  const images = parsePhotoUrls(room?.photo_urls).map((url) => ({ url }));

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        {loading && <p className="text-stone-400">กำลังโหลด...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {room && (
          <>
            <h1 className="text-2xl font-bold text-stone-800">{room.type_name}</h1>
            <p className="mt-1 text-stone-500">{room.description}</p>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <Gallery images={images} />
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
                  <div className="rounded-lg bg-stone-100 p-3">
                    <p className="text-stone-400">ราคาวันธรรมดา / เสาร์-อาทิตย์</p>
                    <p className="font-semibold text-teal-700">
                      {formatCurrency(room.price_weekday)} / {formatCurrency(room.price_weekend)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-stone-100 p-3">
                    <p className="text-stone-400">รับได้สูงสุด</p>
                    <p className="font-semibold">{room.max_guests ?? "-"} ท่าน</p>
                  </div>
                </div>
                {room.amenities && (
                  <p className="mt-3 text-sm text-stone-500">สิ่งอำนวยความสะดวก: {room.amenities}</p>
                )}
              </div>

              <div className="space-y-6">
                <DateRangePicker typeId={room.type_id} onQuoteChange={setQuote} />
                <BookingForm typeId={room.type_id} typeName={room.type_name} quote={quote} />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
