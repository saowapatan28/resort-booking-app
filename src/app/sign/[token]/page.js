"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import SignaturePad from "@/components/SignaturePad";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, SIGN_DOC_TYPE } from "@/lib/constants";
import { getCurrentPosition, formatGeoStamp } from "@/lib/geo";
import { stampSignature } from "@/lib/signatureStamp";
import { buildProcessPdf } from "@/lib/pdf";
import { formatDate } from "@/lib/format";

export default function SignPage() {
  const { token } = useParams();
  const [request, setRequest] = useState(null);
  const [error, setError] = useState(null);
  const [geo, setGeo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sigRef = useRef(null);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_SIGN_REQUEST, { token })
      .then(setRequest)
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
      const stamped = await stampSignature(rawSignature, geo, request.guestName);

      const pdfDataUrl = buildProcessPdf(request.docType, {
        booking: request.booking,
        keyPhotoDataUrl: request.docType === SIGN_DOC_TYPE.CHECKIN ? request.keyPhotoUrl : null,
        signatureDataUrl: stamped,
        geo,
        signedBy: request.guestName,
      });

      await callGas(GAS_ACTIONS.SUBMIT_SIGNATURE, {
        token,
        signatureDataUrl: stamped,
        pdfDataUrl,
        geo,
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
  if (!request) {
    return <CenteredMessage title="กำลังโหลด..." />;
  }
  if (done) {
    return <CenteredMessage title="ขอบคุณครับ/ค่ะ" detail="บันทึกลายเซ็นเรียบร้อยแล้ว ท่านสามารถปิดหน้านี้ได้" success />;
  }

  const title =
    request.docType === SIGN_DOC_TYPE.CHECKIN ? "เอกสารรับกุญแจ (Check-in)" : "เอกสารคืนกุญแจ (Check-out)";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-stone-800">{title}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {request.booking?.roomTypeName} · {formatDate(request.booking?.checkIn)} -{" "}
          {formatDate(request.booking?.checkOut)}
        </p>

        {request.docType === SIGN_DOC_TYPE.CHECKIN && request.keyPhotoUrl && (
          <div className="relative mt-4 h-48 w-full overflow-hidden rounded-lg bg-stone-100">
            <Image src={request.keyPhotoUrl} alt="รูปกุญแจ" fill unoptimized className="object-contain" />
          </div>
        )}

        <p className="mt-4 text-sm text-stone-600">
          กรุณาตรวจสอบข้อมูลด้านบน แล้วลงลายเซ็นเพื่อยืนยัน
          {request.docType === SIGN_DOC_TYPE.CHECKIN
            ? "การรับกุญแจ"
            : "การคืนกุญแจ"}
        </p>

        <div className="mt-4">
          <SignaturePad ref={sigRef} label={`ลายเซ็นของ ${request.guestName ?? "ผู้เข้าพัก"}`} />
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
