"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { callGas, fileToBase64 } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { parsePhotoUrls, isActiveValue } from "@/lib/format";

// [แก้] ฟิลด์ตรงกับ rowData ของ saveRoomType() ใน gas/Code.gs (snake_case ทั้งหมด)
const emptyRoom = {
  type_id: "",
  type_name: "",
  description: "",
  max_guests: "",
  price_weekday: "",
  price_weekend: "",
  total_rooms: "",
  amenities: "",
  photo_urls: "",
  active: true,
};

export default function RoomForm({ initial, onSaved }) {
  const [form, setForm] = useState({
    ...emptyRoom,
    ...initial,
    active: initial?.active === undefined ? true : isActiveValue(initial.active),
  });
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      // [แก้] saveRoomType เก็บ photo_urls เป็นสตริงเดียว ไม่รับไฟล์อัพโหลดตรงๆ —
      // ไม่มี action สำหรับอัพโหลดรูปห้องพักโดยเฉพาะ เลยใช้ uploadDecorPhoto (ปกติ
      // ใช้กับรูป gallery) อัพโหลดรูปใหม่แต่ละไฟล์เพื่อเอา URL มาต่อท้าย photo_urls
      // — ผลข้างเคียง: รูปที่อัพโหลดจะไปโผล่ในชีต gallery ด้วย (ยังไม่มี backend
      // action แยกสำหรับรูปห้องพักโดยเฉพาะ)
      const uploadedUrls = [];
      for (const file of newImages) {
        const { base64, mimeType } = await fileToBase64(file);
        const res = await callGas(GAS_ACTIONS.UPLOAD_DECOR_PHOTO, {
          file_base64: base64,
          file_name: file.name,
          mime_type: mimeType,
          caption: form.type_name,
        });
        uploadedUrls.push(res.url);
      }
      const photoUrls = [...parsePhotoUrls(form.photo_urls), ...uploadedUrls].join(",");

      const saved = await callGas(GAS_ACTIONS.SAVE_ROOM_TYPE, {
        type_id: form.type_id || undefined,
        type_name: form.type_name,
        description: form.description,
        max_guests: Number(form.max_guests) || 0,
        price_weekday: Number(form.price_weekday) || 0,
        price_weekend: Number(form.price_weekend) || 0,
        total_rooms: Number(form.total_rooms) || 0,
        amenities: form.amenities,
        photo_urls: photoUrls,
        active: form.active ? "TRUE" : "FALSE",
      });
      toast.success("บันทึกข้อมูลห้องพักแล้ว");
      onSaved?.(saved);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      <div>
        <label className="mb-1 block text-sm text-stone-600">ชื่อประเภทห้อง *</label>
        <input
          required
          value={form.type_name}
          onChange={update("type_name")}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-stone-600">รายละเอียด</label>
        <textarea
          value={form.description}
          onChange={update("description")}
          rows={3}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-stone-600">ราคาวันธรรมดา / คืน *</label>
          <input
            required
            type="number"
            value={form.price_weekday}
            onChange={update("price_weekday")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">ราคาเสาร์-อาทิตย์ / คืน *</label>
          <input
            required
            type="number"
            value={form.price_weekend}
            onChange={update("price_weekend")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm text-stone-600">จำนวนห้อง *</label>
          <input
            required
            type="number"
            value={form.total_rooms}
            onChange={update("total_rooms")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">รับได้สูงสุด (คน)</label>
          <input
            type="number"
            value={form.max_guests}
            onChange={update("max_guests")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm text-stone-600">สิ่งอำนวยความสะดวก (คั่นด้วย comma)</label>
        <input
          value={form.amenities}
          onChange={update("amenities")}
          placeholder="แอร์, ทีวี, ตู้เย็น"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-stone-600">
        <input
          type="checkbox"
          checked={!!form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
        />
        เปิดใช้งาน (แสดงในหน้าเว็บลูกค้า)
      </label>
      <div>
        <label className="mb-1 block text-sm text-stone-600">เพิ่มรูปภาพ</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setNewImages(Array.from(e.target.files || []))}
          className="block w-full text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
      >
        {saving ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}
