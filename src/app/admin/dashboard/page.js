"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardStats from "@/components/DashboardStats";
import BookingsCalendarView from "@/components/BookingsCalendarView";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { toISODate } from "@/lib/format";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [bookingsByDate, setBookingsByDate] = useState({});

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_DASHBOARD).then(setSummary);
    // [แก้] ไม่มี getBookingsCalendar จริง — ดึง getBookings ทั้งหมดแล้วจัดกลุ่มตาม
    // check_in_date เองฝั่ง client แทน
    callGas(GAS_ACTIONS.GET_BOOKINGS).then((data) => {
      const grouped = {};
      (data ?? []).forEach((b) => {
        if (!b.check_in_date) return;
        const key = toISODate(b.check_in_date);
        (grouped[key] ??= []).push(b);
      });
      setBookingsByDate(grouped);
    });
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
            <li>จำนวนการจองทั้งหมด: {summary?.total_bookings ?? "-"}</li>
            <li>เช็คอินวันนี้: {summary?.checkin_today ?? "-"}</li>
            <li>เช็คเอาท์วันนี้: {summary?.checkout_today ?? "-"}</li>
            <li>รอยืนยัน: {summary?.pending ?? "-"}</li>
            <li>ยืนยันแล้ว: {summary?.confirmed ?? "-"}</li>
          </ul>
        </div>
      </div>
    </ProtectedRoute>
  );
}
