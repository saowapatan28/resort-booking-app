"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { callGas, fileToDataUrl } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

const emptyRoom = {
  name: "",
  description: "",
  basePrice: "",
  totalCount: "",
  images: [],
};

export default function RoomForm({ initial, onSaved }) {
  const [form, setForm] = useState({ ...emptyRoom, ...initial });
  const [newImages, setNewImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const newImageDataUrls = await Promise.all(newImages.map(fileToDataUrl));
      const saved = await callGas(GAS_ACTIONS.SAVE_ROOM_TYPE, {
        id: form.id,
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        totalCount: Number(form.totalCount),
        newImages: newImageDataUrls.map((dataUrl, i) => ({
          dataUrl,
          fileName: newImages[i].name,
        })),
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
          value={form.name}
          onChange={update("name")}
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
          <label className="mb-1 block text-sm text-stone-600">ราคาปกติ / คืน *</label>
          <input
            required
            type="number"
            value={form.basePrice}
            onChange={update("basePrice")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">จำนวนห้อง *</label>
          <input
            required
            type="number"
            value={form.totalCount}
            onChange={update("totalCount")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
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
