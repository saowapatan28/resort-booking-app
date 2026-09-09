"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

const emptyForm = { type_id: "", season_name: "", date_from: "", date_to: "", price: "" };

// [แก้] gas/Code.gs มีแค่ saveSeasonalPrice() (เพิ่มแถวใหม่อย่างเดียว) — ไม่มี
// listSeasonalPrices / deleteSeasonalPrice เลย จึงยังโชว์/ลบราคาเทศกาลที่เพิ่ม
// ไปแล้วในหน้านี้ไม่ได้ (ต้องเปิดชีต seasonal_pricing ดูโดยตรงไปก่อน) — ตัดตาราง
// รายการ + ปุ่มลบของเดิมออก เหลือแค่ฟอร์มเพิ่มอย่างเดียวให้ตรงกับที่ backend ทำได้จริง
export default function PricingPage() {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    callGas(GAS_ACTIONS.GET_ROOM_TYPES).then((data) => setRooms(data ?? []));
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await callGas(GAS_ACTIONS.SAVE_SEASONAL_PRICE, {
        type_id: form.type_id,
        season_name: form.season_name,
        date_from: form.date_from,
        date_to: form.date_to,
        price: Number(form.price),
      });
      toast.success("บันทึกราคาเทศกาลแล้ว");
      setForm(emptyForm);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">ราคาช่วงเทศกาล</h1>
      <p className="mt-1 text-sm text-stone-500">
        เพิ่มราคาช่วงเทศกาลใหม่ได้ที่นี่ — ดูรายการที่เพิ่มไปแล้วในชีต{" "}
        <code className="rounded bg-stone-100 px-1">seasonal_pricing</code> โดยตรง
      </p>

      <form onSubmit={handleSubmit} className="mt-4 max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm text-stone-600">ประเภทห้อง *</label>
          <select
            required
            value={form.type_id}
            onChange={update("type_id")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">-- เลือกห้อง --</option>
            {rooms.map((r) => (
              <option key={r.type_id} value={r.type_id}>
                {r.type_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">ชื่อช่วงเทศกาล *</label>
          <input
            required
            value={form.season_name}
            onChange={update("season_name")}
            placeholder="เช่น สงกรานต์ 2569"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-stone-600">วันที่เริ่ม *</label>
            <input
              required
              type="date"
              value={form.date_from}
              onChange={update("date_from")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">วันที่สิ้นสุด *</label>
            <input
              required
              type="date"
              value={form.date_to}
              onChange={update("date_to")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">ราคา / คืน *</label>
          <input
            required
            type="number"
            value={form.price}
            onChange={update("price")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
        >
          {saving ? "กำลังบันทึก..." : "เพิ่มราคาเทศกาล"}
        </button>
      </form>
    </ProtectedRoute>
  );
}
