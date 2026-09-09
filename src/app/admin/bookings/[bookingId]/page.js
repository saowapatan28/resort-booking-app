"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, BOOKING_STATUS, PAYMENT_STATUS } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export default function BookingDetailPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [busy, setBusy] = useState(false);
  const [refundPct, setRefundPct] = useState(0);
  const [showCancelForm, setShowCancelForm] = useState(false);

  function load() {
    callGas(GAS_ACTIONS.GET_BOOKING_DETAIL, { booking_id: bookingId }).then(setBooking);
  }

  useEffect(load, [bookingId]);

  async function handleReview(approved) {
    setBusy(true);
    try {
      await callGas(GAS_ACTIONS.VERIFY_SLIP, { booking_id: bookingId, approved });
      toast.success(approved ? "ยืนยันการจองแล้ว" : "ปฏิเสธสลิปแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await callGas(GAS_ACTIONS.CANCEL_BOOKING, { booking_id: bookingId, refund_pct: refundPct });
      toast.success(`ยกเลิกการจองแล้ว คืนเงิน ${formatCurrency(res.refund_amount)}`);
      load();
      setShowCancelForm(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!booking) {
    return (
      <ProtectedRoute roles={["owner"]}>
        <p className="text-stone-400">กำลังโหลด...</p>
      </ProtectedRoute>
    );
  }

  const refundAmount = ((Number(booking.total_price) || 0) * refundPct) / 100;

  return (
    <ProtectedRoute roles={["owner"]}>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-800">การจอง {booking.booking_id}</h1>
          <div className="flex gap-2">
            <StatusBadge bookingStatus={booking.booking_status} />
            <StatusBadge paymentStatus={booking.payment_status} />
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-5">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-stone-400">ผู้จอง</dt>
            <dd>{booking.guest?.full_name}</dd>
            <dt className="text-stone-400">เบอร์โทร</dt>
            <dd>{booking.guest?.phone}</dd>
            <dt className="text-stone-400">อีเมล</dt>
            <dd>{booking.guest?.email}</dd>
            <dt className="text-stone-400">ห้องพัก</dt>
            <dd>
              {booking.room_id} ({booking.type_id})
            </dd>
            <dt className="text-stone-400">วันที่เข้าพัก</dt>
            <dd>
              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)} ({booking.nights} คืน)
            </dd>
            <dt className="text-stone-400">ยอดรวม</dt>
            <dd className="font-semibold text-teal-700">{formatCurrency(booking.total_price)}</dd>
            <dt className="text-stone-400">วันที่จอง</dt>
            <dd>{formatDateTime(booking.created_at)}</dd>
          </dl>
        </div>

        {booking.slip_url && (
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="mb-2 font-semibold text-stone-800">สลิปการโอนเงิน</p>
            <div className="relative h-80 w-full overflow-hidden rounded-lg bg-stone-100">
              <Image src={booking.slip_url} alt="slip" fill unoptimized className="object-contain" />
            </div>

            {booking.payment_status === PAYMENT_STATUS.PENDING_REVIEW && (
              <div className="mt-4 flex gap-3">
                <button
                  disabled={busy}
                  onClick={() => handleReview(true)}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700 disabled:bg-stone-300"
                >
                  ยืนยันการจอง
                </button>
                <button
                  disabled={busy}
                  onClick={() => handleReview(false)}
                  className="flex-1 rounded-lg bg-red-600 py-2 font-semibold text-white hover:bg-red-700 disabled:bg-stone-300"
                >
                  ปฏิเสธสลิป
                </button>
              </div>
            )}
          </div>
        )}

        {![BOOKING_STATUS.CANCELLED, BOOKING_STATUS.CHECKED_OUT].includes(booking.booking_status) && (
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="font-semibold text-stone-800">ยกเลิกการจอง</p>
            {!showCancelForm ? (
              <button
                onClick={() => setShowCancelForm(true)}
                className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                ยกเลิกการจองนี้
              </button>
            ) : (
              <div className="mt-3 space-y-3">
                <label className="block text-sm text-stone-600">เปอร์เซ็นต์คืนเงิน (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={refundPct}
                  onChange={(e) => setRefundPct(Number(e.target.value))}
                  className="w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
                <p className="text-sm text-stone-600">
                  ยอดคืนเงิน: <span className="font-semibold text-teal-700">{formatCurrency(refundAmount)}</span> จาก{" "}
                  {formatCurrency(booking.total_price)}
                </p>
                <div className="flex gap-3">
                  <button
                    disabled={busy}
                    onClick={handleCancel}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-stone-300"
                  >
                    ยืนยันยกเลิก + คืนเงิน
                  </button>
                  <button
                    onClick={() => setShowCancelForm(false)}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-stone-100"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
