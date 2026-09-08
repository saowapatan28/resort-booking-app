"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export default function BookingStatusPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_BOOKING_STATUS, { bookingId })
      .then(setBooking)
      .catch((err) => setError(err.message));
  }, [bookingId]);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-stone-800">สถานะการจอง</h1>

        {error && <p className="mt-4 text-red-600">{error}</p>}

        {booking && (
          <div className="mt-6 space-y-3 rounded-xl border border-stone-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">เลขที่การจอง</span>
              <span className="font-mono font-semibold">{booking.bookingId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">สถานะ</span>
              <StatusBadge status={booking.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">ห้องพัก</span>
              <span>{booking.roomTypeName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">เข้าพัก - ออก</span>
              <span>
                {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-lg font-bold text-teal-700">
              <span>ยอดรวม</span>
              <span>{formatCurrency(booking.total)}</span>
            </div>

            <p className="pt-4 text-sm text-stone-500">
              ระบบได้ส่งอีเมลยืนยันไปที่ {booking.guest?.email ?? "อีเมลที่ท่านระบุ"} แล้ว
              เมื่อเจ้าหน้าที่ตรวจสอบสลิปเรียบร้อย ท่านจะได้รับอีเมลยืนยันอีกครั้ง
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
