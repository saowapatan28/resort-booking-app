"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardStats from "@/components/DashboardStats";
import BookingsCalendarView from "@/components/BookingsCalendarView";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [bookingsByDate, setBookingsByDate] = useState({});

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_DASHBOARD_SUMMARY).then(setSummary);
    callGas(GAS_ACTIONS.GET_BOOKINGS_CALENDAR).then((data) => setBookingsByDate(data ?? {}));
  }, []);

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">Dashboard</h1>

      <div className="mt-4">
        <DashboardStats summary={summary} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BookingsCalendarView bookingsByDate={bookingsByDate} />

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="font-semibold text-stone-800">สรุปด่วน</p>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>จำนวนการจองทั้งหมด: {summary?.totalBookings ?? "-"}</li>
            <li>เช็คอินวันนี้: {summary?.checkinsToday ?? "-"}</li>
            <li>เช็คเอาท์วันนี้: {summary?.checkoutsToday ?? "-"}</li>
            <li>รอตรวจสอบสลิป: {summary?.pendingReviewCount ?? "-"}</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
