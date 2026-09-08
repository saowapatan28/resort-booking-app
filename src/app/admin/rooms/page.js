"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    callGas(GAS_ACTIONS.GET_ROOM_TYPES)
      .then((data) => setRooms(data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleDelete(id) {
    if (!confirm("ยืนยันการลบประเภทห้องนี้?")) return;
    try {
      await callGas(GAS_ACTIONS.DELETE_ROOM_TYPE, { id });
      toast.success("ลบแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <ProtectedRoute roles={["owner"]}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-stone-800">จัดการห้องพัก</h1>
        <Link
          href="/admin/rooms/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          + เพิ่มประเภทห้อง
        </Link>
      </div>

      {loading && <p className="mt-4 text-stone-400">กำลังโหลด...</p>}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="font-semibold text-stone-800">{room.name}</p>
            <p className="mt-1 text-sm text-stone-500">
              {formatCurrency(room.basePrice)}/คืน · {room.totalCount} ห้อง
            </p>
            <div className="mt-3 flex gap-3 text-sm">
              <Link href={`/admin/rooms/${room.id}`} className="font-medium text-teal-700 hover:underline">
                แก้ไข
              </Link>
              <button onClick={() => handleDelete(room.id)} className="font-medium text-red-600 hover:underline">
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </ProtectedRoute>
  );
}
