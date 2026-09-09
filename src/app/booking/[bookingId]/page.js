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
  const [roomTypeName, setRoomTypeName] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // getBookingStatus (public) ตั้งใจไม่คืนข้อมูลแขก/ห้องแบบเจาะจง เพื่อไม่ให้
    // คนอื่นที่รู้แค่ booking_id เดารายละเอียดส่วนตัวได้ — คืนแค่ field การจองเอง
    callGas(GAS_ACTIONS.GET_BOOKING_STATUS, { booking_id: bookingId })
      .then(setBooking)
      .catch((err) => setError(err.message));
  }, [bookingId]);

  // [เพิ่มใหม่] getRoomTypes เป็น public action — ใช้แปลง type_id เป็นชื่อห้องที่อ่านง่าย
  useEffect(() => {
    if (!booking?.type_id) return;
    callGas(GAS_ACTIONS.GET_ROOM_TYPES)
      .then((types) => {
        const match = (types ?? []).find((t) => t.type_id === booking.type_id);
        setRoomTypeName(match?.type_name ?? booking.type_id);
      })
      .catch(() => setRoomTypeName(booking.type_id));
  }, [booking?.type_id]);

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
              <span className="font-mono font-semibold">{booking.booking_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">สถานะการจอง</span>
              <StatusBadge bookingStatus={booking.booking_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">สถานะการชำระเงิน</span>
              <StatusBadge paymentStatus={booking.payment_status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">ห้องพัก</span>
              <span>{roomTypeName ?? booking.type_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-stone-400">เข้าพัก - ออก</span>
              <span>
                {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                {booking.nights ? ` (${booking.nights} คืน)` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-lg font-bold text-teal-700">
              <span>ยอดรวม</span>
              <span>{formatCurrency(booking.total_price)}</span>
            </div>

            <p className="pt-4 text-sm text-stone-500">
              ระบบได้ส่งอีเมลยืนยันไปที่อีเมลที่ท่านระบุตอนจองแล้ว
              เมื่อเจ้าหน้าที่ตรวจสอบสลิปเรียบร้อย ท่านจะได้รับอีเมลยืนยันอีกครั้ง
            </p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
