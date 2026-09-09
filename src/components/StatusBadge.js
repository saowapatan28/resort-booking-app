import {
  BOOKING_STATUS,
  BOOKING_STATUS_LABEL,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
} from "@/lib/constants";

const BOOKING_COLORS = {
  [BOOKING_STATUS.PENDING]: "bg-amber-100 text-amber-800",
  [BOOKING_STATUS.CONFIRMED]: "bg-emerald-100 text-emerald-800",
  [BOOKING_STATUS.CHECKED_IN]: "bg-teal-100 text-teal-800",
  [BOOKING_STATUS.CHECKED_OUT]: "bg-stone-200 text-stone-700",
  [BOOKING_STATUS.CANCELLED]: "bg-red-100 text-red-700 line-through",
};

const PAYMENT_COLORS = {
  [PAYMENT_STATUS.PENDING_SLIP]: "bg-amber-100 text-amber-800",
  [PAYMENT_STATUS.PENDING_REVIEW]: "bg-blue-100 text-blue-800",
  [PAYMENT_STATUS.APPROVED]: "bg-emerald-100 text-emerald-800",
  [PAYMENT_STATUS.REJECTED]: "bg-red-100 text-red-800",
};

// [แก้] gas/Code.gs เก็บสถานะเป็น 2 ฟิลด์แยกกัน (booking_status / payment_status)
// ไม่ใช่ enum เดียวแบบที่ component นี้เคยสมมติไว้ — รับมาเฉพาะ prop ที่ส่งมาจริง
export default function StatusBadge({ bookingStatus, paymentStatus, status }) {
  // เผื่อโค้ดเก่าที่ยังเรียกด้วย status={booking.booking_status} เฉยๆ
  const value = bookingStatus ?? paymentStatus ?? status;
  const label = bookingStatus
    ? BOOKING_STATUS_LABEL[value] ?? value
    : paymentStatus
    ? PAYMENT_STATUS_LABEL[value] ?? value
    : BOOKING_STATUS_LABEL[value] ?? PAYMENT_STATUS_LABEL[value] ?? value;
  const color = BOOKING_COLORS[value] ?? PAYMENT_COLORS[value] ?? "bg-stone-100 text-stone-700";

  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
