"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

export default function CheckinListPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callGas(GAS_ACTIONS.LIST_TODAY_TASKS, { type: "checkin" })
      .then((data) => setTasks(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute roles={["admin", "owner"]}>
      <h1 className="text-xl font-bold text-stone-800">รายการ Check-in วันนี้</h1>

      {loading && <p className="mt-4 text-stone-400">กำลังโหลด...</p>}
      {!loading && tasks.length === 0 && (
        <p className="mt-4 text-stone-400">ไม่มีรายการเช็คอินวันนี้</p>
      )}

      <div className="mt-4 space-y-3">
        {tasks.map((t) => (
          <Link
            key={t.bookingId}
            href={`/admin/checkin/${t.bookingId}`}
            className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-4 hover:shadow-sm"
          >
            <div>
              <p className="font-semibold text-stone-800">{t.guestName}</p>
              <p className="text-sm text-stone-500">
                {t.roomTypeName} · {formatDate(t.checkIn)}
              </p>
            </div>
            <StatusBadge status={t.status} />
          </Link>
        ))}
      </div>
    </ProtectedRoute>
  );
}
