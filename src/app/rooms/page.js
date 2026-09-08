"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_ROOM_TYPES)
      .then((data) => setRooms(data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold text-stone-800">ห้องพักทั้งหมด</h1>
        <p className="mt-1 text-stone-500">เลือกประเภทห้องที่ต้องการเพื่อดูรายละเอียดและจอง</p>

        {loading && <p className="mt-8 text-stone-400">กำลังโหลดห้องพัก...</p>}
        {error && <p className="mt-8 text-red-600">{error}</p>}

        {!loading && !error && rooms.length === 0 && (
          <p className="mt-8 text-stone-400">ยังไม่มีห้องพักในระบบ</p>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
