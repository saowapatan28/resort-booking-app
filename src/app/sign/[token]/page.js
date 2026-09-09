"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import SignaturePad from "@/components/SignaturePad";
import { callGas, dataUrlToBase64 } from "@/lib/gasClient";
import { GAS_ACTIONS, SIGN_DOC_TYPE } from "@/lib/constants";
import { getCurrentPosition, formatGeoStamp, formatGeoValue } from "@/lib/geo";
import { stampSignature } from "@/lib/signatureStamp";
import { formatDate } from "@/lib/format";

export default function SignPage() {
  const { token } = useParams();
  const [link, setLink] = useState(null);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [geo, setGeo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sigRef = useRef(null);

  useEffect(() => {
    // getSignLink คืน { link, booking } — booking มาจาก getBookingDetail
    // (ไม่รวมข้อมูลจาก checkin_checkout เช่นรูปกุญแจ เลยแสดงรูปกุญแจตรงนี้ไม่ได้)
    callGas(GAS_ACTIONS.GET_SIGN_LINK, { token })
      .then((data) => {
        setLink(data.link);
        setBooking(data.booking);
      })
      .catch((err) => setError(err.message));
    getCurrentPosition().then(setGeo);
  }, [token]);

  async function handleSubmit() {
    if (sigRef.current?.isEmpty()) {
      toast.error("กรุณาเซ็นชื่อก่อนกดยืนยัน");
      return;
    }
    setSubmitting(true);
    try {
      const rawSignature = sigRef.current.getDataUrl();
      const stamped = await stampSignature(rawSignature, geo, booking?.guest?.full_name);

      await callGas(GAS_ACTIONS.SUBMIT_SIGNATURE, {
        token,
        signature_base64: dataUrlToBase64(stamped),
        gps: formatGeoValue(geo),
      });

      setDone(true);
      toast.success("บันทึกลายเซ็นเรียบร้อยแล้ว");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (error) {
    return <CenteredMessage title="ลิงก์ไม่ถูกต้องหรือหมดอายุ" detail={error} />;
  }
  if (!link || !booking) {
    return <CenteredMessage title="กำลังโหลด..." />;
  }
  if (done) {
    return (
      <CenteredMessage
        title="ขอบคุณครับ/ค่ะ"
        detail="บันทึกลายเซ็นเรียบร้อยแล้ว ท่านสามารถปิดหน้านี้ได้"
        success
      />
    );
  }

  const title =
    link.type === SIGN_DOC_TYPE.CHECKIN ? "เอกสารรับกุญแจ (Check-in)" : "เอกสารคืนกุญแจ (Check-out)";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-stone-800">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {booking.type_id} · {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
        </p>

        <p className="mt-4 text-sm text-stone-600">
          กรุณาตรวจสอบข้อมูลด้านบน แล้วลงลายเซ็นเพื่อยืนยัน
          {link.type === SIGN_DOC_TYPE.CHECKIN ? "การรับกุญแจ" : "การคืนกุญแจ"}
        </p>

        <div className="mt-4">
          <SignaturePad ref={sigRef} label={`ลายเซ็นของ ${booking.guest?.full_name ?? "ผู้เข้าพัก"}`} />
        </div>

        <p className="mt-2 text-xs text-stone-400">{formatGeoStamp(geo)}</p>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-4 w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
        >
          {submitting ? "กำลังบันทึก..." : "ยืนยันลายเซ็น"}
        </button>
      </div>
    </main>
  );
}

function CenteredMessage({ title, detail, success }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <p className={`text-lg font-semibold ${success ? "text-emerald-600" : "text-stone-700"}`}>
          {title}
        </p>
        {detail && <p className="mt-2 text-sm text-stone-500">{detail}</p>}
      </div>
    </main>
  );
}
