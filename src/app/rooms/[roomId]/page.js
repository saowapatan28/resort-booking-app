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
import { formatCurrency } from "@/lib/format";

export default function RoomDetailPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_ROOM_TYPES, { roomTypeId: roomId })
      .then((data) => setRoom(Array.isArray(data) ? data[0] : data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [roomId]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        {loading && <p className="text-stone-400">กำลังโหลด...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {room && (
          <>
            <h1 className="text-2xl font-bold text-stone-800">{room.name}</h1>
            <p className="mt-1 text-stone-500">{room.description}</p>

            <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div>
                <Gallery images={room.images ?? []} />
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
                  <div className="rounded-lg bg-stone-100 p-3">
                    <p className="text-stone-400">ราคาปกติ</p>
                    <p className="font-semibold text-teal-700">{formatCurrency(room.basePrice)}/คืน</p>
                  </div>
                  <div className="rounded-lg bg-stone-100 p-3">
                    <p className="text-stone-400">ห้องว่าง</p>
                    <p className="font-semibold">{room.availableCount ?? 0} ห้อง</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <DateRangePicker
                  roomTypeId={room.id}
                  basePrice={room.basePrice}
                  onQuoteChange={setQuote}
                />
                <BookingForm roomTypeId={room.id} roomTypeName={room.name} quote={quote} />
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
