"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { callGas, fileToDataUrl } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import SlipUpload from "./SlipUpload";

export default function BookingForm({ roomTypeId, roomTypeName, quote }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", idCard: "" });
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = quote && form.fullName && form.phone && form.email && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quote) {
      toast.error("กรุณาเลือกวันเข้าพัก-ออกก่อน");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await callGas(GAS_ACTIONS.CREATE_BOOKING, {
        roomTypeId,
        roomTypeName,
        checkIn: quote.checkIn,
        checkOut: quote.checkOut,
        nights: quote.nights,
        total: quote.total,
        guest: form,
      });

      if (slipFile) {
        const dataUrl = await fileToDataUrl(slipFile);
        await callGas(GAS_ACTIONS.UPLOAD_SLIP, {
          bookingId: booking.bookingId,
          fileName: slipFile.name,
          fileDataUrl: dataUrl,
        });
      }

      toast.success("ส่งคำขอจองสำเร็จ! กรุณาตรวจสอบอีเมลของท่าน");
      router.push(`/booking/${booking.bookingId}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-semibold text-stone-800">ข้อมูลผู้จอง</h3>

      <div>
        <label className="mb-1 block text-sm text-stone-600">ชื่อ-นามสกุล *</label>
        <input
          required
          value={form.fullName}
          onChange={update("fullName")}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-stone-600">เบอร์โทร *</label>
          <input
            required
            value={form.phone}
            onChange={update("phone")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">อีเมล *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={update("email")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-stone-600">เลขบัตรประชาชน (ไม่บังคับ)</label>
        <input
          value={form.idCard}
          onChange={update("idCard")}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
        />
      </div>

      <SlipUpload file={slipFile} onChange={setSlipFile} />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {submitting ? "กำลังส่งคำขอจอง..." : "ยืนยันการจอง"}
      </button>
    </form>
  );
}
