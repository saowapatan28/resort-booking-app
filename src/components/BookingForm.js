"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { callGas, fileToBase64 } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import SlipUpload from "./SlipUpload";

export default function BookingForm({ typeId, typeName, quote }) {
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", id_card: "" });
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const canSubmit = quote && form.full_name && form.phone && form.email && !submitting;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!quote) {
      toast.error("กรุณาเลือกวันเข้าพัก-ออกก่อน");
      return;
    }
    // [แก้] createBooking ผูกกับ room_id ห้องจริงห้องหนึ่ง ไม่ใช่แค่ประเภทห้อง —
    // เลือกห้องว่างห้องแรกจาก checkAvailability ให้อัตโนมัติ (UI นี้ไม่มีตัวเลือก
    // ห้องเจาะจง ยังเป็นงานที่ต้องทำต่อถ้าอยากให้ลูกค้าเลือกห้องเองได้)
    const room = quote.rooms?.[0];
    if (!room) {
      toast.error("ไม่มีห้องว่างในช่วงเวลาที่เลือก");
      return;
    }
    setSubmitting(true);
    try {
      const booking = await callGas(GAS_ACTIONS.CREATE_BOOKING, {
        guest: form,
        room_id: room.room_id,
        type_id: typeId,
        check_in: quote.check_in,
        check_out: quote.check_out,
      });

      if (slipFile) {
        const { base64, mimeType } = await fileToBase64(slipFile);
        await callGas(GAS_ACTIONS.UPLOAD_SLIP, {
          booking_id: booking.booking_id,
          file_base64: base64,
          mime_type: mimeType,
        });
      }

      toast.success("ส่งคำขอจองสำเร็จ! กรุณาตรวจสอบอีเมลของท่าน");
      router.push(`/booking/${booking.booking_id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-semibold text-stone-800">ข้อมูลผู้จอง{typeName ? ` — ${typeName}` : ""}</h3>

      <div>
        <label className="mb-1 block text-sm text-stone-600">ชื่อ-นามสกุล *</label>
        <input
          required
          value={form.full_name}
          onChange={update("full_name")}
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
          value={form.id_card}
          onChange={update("id_card")}
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
