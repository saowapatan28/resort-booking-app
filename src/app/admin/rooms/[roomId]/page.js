"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoomForm from "@/components/RoomForm";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

export default function EditRoomPage() {
  const { roomId: typeId } = useParams();
  const router = useRouter();
  const isNew = typeId === "new";
  const [room, setRoom] = useState(isNew ? {} : null);

  useEffect(() => {
    if (isNew) return;
    // [แก้] getRoomTypes ไม่รับ id มากรอง — ดึงทั้งหมดแล้วหาเอาเองฝั่ง client
    callGas(GAS_ACTIONS.GET_ROOM_TYPES).then((data) => {
      setRoom((data ?? []).find((r) => r.type_id === typeId) ?? null);
    });
  }, [typeId, isNew]);

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">{isNew ? "เพิ่มประเภทห้อง" : "แก้ไขประเภทห้อง"}</h1>
      <div className="mt-4 max-w-xl">
        {room && <RoomForm initial={room} onSaved={() => router.push("/admin/rooms")} />}
      </div>
    </ProtectedRoute>
  );
}
