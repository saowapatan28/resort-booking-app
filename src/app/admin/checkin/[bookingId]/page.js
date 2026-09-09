"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import CameraCapture from "@/components/CameraCapture";
import SignaturePad from "@/components/SignaturePad";
import StatusBadge from "@/components/StatusBadge";
import { callGas, fileToBase64, dataUrlToBase64 } from "@/lib/gasClient";
import { GAS_ACTIONS, SIGN_DOC_TYPE, BOOKING_STATUS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { getCurrentPosition, formatGeoStamp, formatGeoValue } from "@/lib/geo";
import { stampSignature } from "@/lib/signatureStamp";
import { buildProcessPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/format";

export default function CheckinDetailPage() {
  const { bookingId } = useParams();
  const { session } = useAuth();
  const [booking, setBooking] = useState(null);
  const [keyPhotoDataUrl, setKeyPhotoDataUrl] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [mode, setMode] = useState(null); // "onsite" | "remote"
  const [geo, setGeo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [signLinkSent, setSignLinkSent] = useState(null);
  const sigRef = useRef(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_BOOKING_DETAIL, { booking_id: bookingId }).then((data) => {
      setBooking(data);
      setCheckedIn(data.booking_status === BOOKING_STATUS.CHECKED_IN);
    });
    getCurrentPosition().then(setGeo);
  }, [bookingId]);

  // [แก้] ของเดิมมี action "uploadKeyPhoto" แยกต่างหากซึ่งไม่มีจริง — การเช็คอินจริง
  // (สร้างแถวใน checkin_checkout + เปลี่ยน booking_status เป็น "check-in") เกิดขึ้น
  // ที่ action "checkin" ตัวเดียว ต้องส่งรูปกุญแจไปพร้อมกันเลย
  async function handlePhotoCapture(dataUrl, file) {
    setKeyPhotoDataUrl(dataUrl);
    setUploadingPhoto(true);
    try {
      const { base64 } = await fileToBase64(file);
      await callGas(GAS_ACTIONS.CHECKIN, {
        booking_id: bookingId,
        key_photo_base64: base64,
        admin_user_id: session?.userId,
        gps: formatGeoValue(geo),
      });
      setCheckedIn(true);
      setBooking((b) => ({ ...b, booking_status: BOOKING_STATUS.CHECKED_IN }));
      toast.success("เช็คอินแล้ว บันทึกรูปกุญแจสำเร็จ");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSendLink() {
    setSubmitting(true);
    try {
      const res = await callGas(GAS_ACTIONS.SEND_SIGN_LINK, {
        booking_id: bookingId,
        type: SIGN_DOC_TYPE.CHECKIN,
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

      // [แก้] ไม่มี action "saveOnsiteSignature" — ลายเซ็นแบบเซ็นหน้างานฝัง (embed)
      // ลงใน PDF โดยตรงแล้วเซฟผ่าน "generatePDF" ตัวเดียว (ไม่มีที่เก็บ signature_url
      // แยกสำหรับกรณีนี้ — คนละ path กับการเซ็นทางไกลผ่านลิงก์ที่ใช้ submitSignature)
      const pdfDataUrl = buildProcessPdf(SIGN_DOC_TYPE.CHECKIN, {
        booking,
        keyPhotoDataUrl,
        signatureDataUrl: stamped,
        geo,
        signedBy: booking.guest?.full_name,
      });

      await callGas(GAS_ACTIONS.GENERATE_PDF, {
        booking_id: bookingId,
        type: SIGN_DOC_TYPE.CHECKIN,
        pdf_base64: dataUrlToBase64(pdfDataUrl),
      });

      toast.success("เช็คอินสำเร็จ!");
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
          <h1 className="text-xl font-bold text-stone-800">Check-in: {booking.guest?.full_name}</h1>
          <StatusBadge bookingStatus={booking.booking_status} />
        </div>
        <p className="mt-1 text-sm text-stone-500">
          ห้อง {booking.room_id} ({booking.type_id}) · {formatDate(booking.check_in_date)} -{" "}
          {formatDate(booking.check_out_date)}
        </p>

        <div className="mt-6 space-y-6 rounded-xl border border-stone-200 bg-white p-5">
          <CameraCapture label="ถ่ายรูปกุญแจ" onCapture={handlePhotoCapture} dataUrl={keyPhotoDataUrl} />
          {uploadingPhoto && <p className="text-xs text-stone-400">กำลังบันทึกการเช็คอิน...</p>}

          {checkedIn && !mode && (
            <div>
              <p className="mb-2 text-sm font-medium text-stone-700">วิธีเซ็นเอกสาร</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMode("onsite")}
                  className="flex-1 rounded-lg bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  เซ็นที่หน้างาน
                </button>
                <button
                  onClick={() => setMode("remote")}
                  className="flex-1 rounded-lg border border-teal-700 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
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
                {submitting ? "กำลังบันทึก..." : "บันทึกเอกสารเช็คอิน"}
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
              <br />
              <span className="text-xs text-emerald-600">
                หมายเหตุ: หลังลูกค้าเซ็นทางลิงก์ ระบบยังไม่สร้าง PDF ให้อัตโนมัติ (backend ยังไม่มี
                action ดึงลายเซ็นที่เซ็นทางไกลกลับมาสร้างเอกสารได้)
              </span>
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
