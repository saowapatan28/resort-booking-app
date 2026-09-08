"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, BOOKING_STATUS, BOOKING_STATUS_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

const FILTERS = ["all", ...Object.values(BOOKING_STATUS)];

export default function BookingsListPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    callGas(GAS_ACTIONS.LIST_BOOKINGS, { status: filter === "all" ? null : filter })
      .then((data) => setBookings(data ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">การจองทั้งหมด</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === f ? "bg-teal-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {f === "all" ? "ทั้งหมด" : BOOKING_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {loading && <p className="mt-4 text-stone-400">กำลังโหลด...</p>}

      <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">เลขที่จอง</th>
              <th className="px-4 py-2">ผู้จอง</th>
              <th className="px-4 py-2">ห้อง</th>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">ยอดรวม</th>
              <th className="px-4 py-2">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.bookingId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/bookings/${b.bookingId}`} className="font-mono text-teal-700 hover:underline">
                    {b.bookingId}
                  </Link>
                </td>
                <td className="px-4 py-2">{b.guestName}</td>
                <td className="px-4 py-2">{b.roomTypeName}</td>
                <td className="px-4 py-2">
                  {formatDate(b.checkIn)} - {formatDate(b.checkOut)}
                </td>
                <td className="px-4 py-2">{formatCurrency(b.total)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  ไม่มีข้อมูลการจอง
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
