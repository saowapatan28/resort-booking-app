"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import SignaturePad from "@/components/SignaturePad";
import StatusBadge from "@/components/StatusBadge";
import { callGas, dataUrlToBase64 } from "@/lib/gasClient";
import { GAS_ACTIONS, SIGN_DOC_TYPE, BOOKING_STATUS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPosition, formatGeoStamp, formatGeoValue } from "@/lib/geo";
import { stampSignature } from "@/lib/signatureStamp";
import { buildProcessPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/format";

export default function CheckoutDetailPage() {
  const { bookingId } = useParams();
  const { session } = useAuth();
  const [booking, setBooking] = useState(null);
  const [mode, setMode] = useState(null); // "onsite" | "remote"
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [geo, setGeo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [signLinkSent, setSignLinkSent] = useState(null);
  const sigRef = useRef(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_BOOKING_DETAIL, { booking_id: bookingId }).then(setBooking);
    getCurrentPosition().then(setGeo);
  }, [bookingId]);

  // [แก้] ของเดิมไม่เคยเรียก action "checkout" เลย (มีแต่ onsite-signature/PDF) —
  // เพิ่มขั้นเรียก checkout() ตอนเลือกวิธีเซ็นเอกสารครั้งแรก เพื่อบันทึก
  // checkout_at/checkout_by/checkout_gps จริง + เปลี่ยน booking_status เป็น "check-out"
  async function chooseMode(nextMode) {
    if (booking.booking_status === BOOKING_STATUS.CHECKED_OUT) {
      setMode(nextMode);
      return;
    }
    setStartingCheckout(true);
    try {
      await callGas(GAS_ACTIONS.CHECKOUT, {
        booking_id: bookingId,
        admin_user_id: session?.userId,
        gps: formatGeoValue(geo),
      });
      setBooking((b) => ({ ...b, booking_status: BOOKING_STATUS.CHECKED_OUT }));
      setMode(nextMode);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setStartingCheckout(false);
    }
  }

  async function handleSendLink() {
    setSubmitting(true);
    try {
      const res = await callGas(GAS_ACTIONS.SEND_SIGN_LINK, {
        booking_id: bookingId,
        type: SIGN_DOC_TYPE.CHECKOUT,
        send_to: booking.guest?.email || booking.guest?.phone,
        send_via: "email",
      });
      setSignLinkSent(res.sign_url);
      toast.success("ส่งลิงก์เซ็นเอกสารให้ลูกค้าทางอีเมลแล้ว");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOnsiteSubmit() {
    if (sigRef.current?.isEmpty()) {
      toast.error("กรุณาให้ลูกค้าเซ็นชื่อก่อน");
      return;
    }
    setSubmitting(true);
    try {
      const raw = sigRef.current.getDataUrl();
      const stamped = await stampSignature(raw, geo, booking.guest?.full_name);

      const pdfDataUrl = buildProcessPdf(SIGN_DOC_TYPE.CHECKOUT, {
        booking,
        signatureDataUrl: stamped,
        geo,
        signedBy: booking.guest?.full_name,
      });

      await callGas(GAS_ACTIONS.GENERATE_PDF, {
        booking_id: bookingId,
        type: SIGN_DOC_TYPE.CHECKOUT,
        pdf_base64: dataUrlToBase64(pdfDataUrl),
      });

      toast.success("เช็คเอาท์สำเร็จ!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) {
    return (
      <ProtectedRoute roles={["admin", "owner"]}>
        <p className="text-stone-400">กำลังโหลด...</p>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute roles={["admin", "owner"]}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-800">Check-out: {booking.guest?.full_name}</h1>
          <StatusBadge bookingStatus={booking.booking_status} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          ห้อง {booking.room_id} ({booking.type_id}) · {formatDate(booking.check_in_date)} -{" "}
          {formatDate(booking.check_out_date)}
        </p>

        <div className="mt-6 space-y-6 rounded-xl border border-stone-200 bg-white p-5">
          {!mode && (
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">วิธีเซ็นเอกสารคืนกุญแจ</p>
              <div className="flex gap-3">
                <button
                  onClick={() => chooseMode("onsite")}
                  disabled={startingCheckout}
                  className="flex-1 rounded-lg bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
                >
                  เซ็นที่หน้างาน
                </button>
                <button
                  onClick={() => chooseMode("remote")}
                  disabled={startingCheckout}
                  className="flex-1 rounded-lg border border-teal-700 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                >
                  ส่งลิงก์ให้ลูกค้าเซ็น
                </button>
              </div>
            </div>
          )}

          {mode === "onsite" && (
            <div>
              <SignaturePad ref={sigRef} label={`ลายเซ็นของ ${booking.guest?.full_name}`} />
              <p className="mt-2 text-xs text-stone-400">{formatGeoStamp(geo)}</p>
              <button
                onClick={handleOnsiteSubmit}
                disabled={submitting}
                className="mt-3 w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึกเอกสารเช็คเอาท์"}
              </button>
            </div>
          )}

          {mode === "remote" && !signLinkSent && (
            <button
              onClick={handleSendLink}
              disabled={submitting}
              className="w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
            >
              {submitting ? "กำลังส่ง..." : "ส่งลิงก์เซ็นเอกสารทางอีเมล"}
            </button>
          )}

          {signLinkSent && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              ส่งลิงก์แล้ว: <span className="break-all font-mono">{signLinkSent}</span>
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
