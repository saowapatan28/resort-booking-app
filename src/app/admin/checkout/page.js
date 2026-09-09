"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, BOOKING_STATUS } from "@/lib/constants";
import { formatDate, toISODate } from "@/lib/format";

export default function CheckoutListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // [แก้] ไม่มี listTodayTasks และ getBookings กรองวันที่ได้แค่ check_in_date
    // (ไม่รองรับกรองด้วย check_out_date) — ดึงทุกรายการที่ยัง check-in อยู่มา
    // แล้วกรอง check_out_date === วันนี้ เองฝั่ง client แทน
    const today = toISODate(new Date());
    callGas(GAS_ACTIONS.GET_BOOKINGS, { status: BOOKING_STATUS.CHECKED_IN })
      .then((data) =>
        setTasks((data ?? []).filter((b) => toISODate(b.check_out_date) === today))
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["admin", "owner"]}>
      <h1 className="text-xl font-bold text-stone-800">รายการ Check-out วันนี้</h1>

      {loading && <p className="mt-4 text-stone-400">กำลังโหลด...</p>}
      {!loading && tasks.length === 0 && (
        <p className="mt-4 text-stone-400">ไม่มีรายการเช็คเอาท์วันนี้</p>
      )}

      <div className="mt-4 space-y-3">
        {tasks.map((t) => (
          <Link
            key={t.booking_id}
            href={`/admin/checkout/${t.booking_id}`}
            className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm"
          >
            <div>
              <p className="font-semibold text-stone-800">{t.booking_id}</p>
              <p className="text-sm text-stone-500">
                ห้อง {t.room_id} ({t.type_id}) · {formatDate(t.check_out_date)}
              </p>
            </div>
            <StatusBadge bookingStatus={t.booking_status} />
          </Link>
        ))}
      </div>
    </ProtectedRoute>
  );
}
