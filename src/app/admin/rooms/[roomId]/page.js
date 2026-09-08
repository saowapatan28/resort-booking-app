"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoomForm from "@/components/RoomForm";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

export default function EditRoomPage() {
  const { roomId } = useParams();
  const router = useRouter();
  const isNew = roomId === "new";
  const [room, setRoom] = useState(isNew ? {} : null);

  useEffect(() => {
    if (isNew) return;
    callGas(GAS_ACTIONS.GET_ROOM_TYPES, { roomTypeId: roomId }).then((data) =>
      setRoom(Array.isArray(data) ? data[0] : data)
    );
  }, [roomId, isNew]);

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">{isNew ? "เพิ่มประเภทห้อง" : "แก้ไขประเภทห้อง"}</h1>
      <div className="mt-4 max-w-xl">
        {room && <RoomForm initial={room} onSaved={() => router.push("/admin/rooms")} />}
      </div>
    </ProtectedRoute>
  );
}
