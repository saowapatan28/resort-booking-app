"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

const emptyForm = { roomTypeId: "", label: "", startDate: "", endDate: "", price: "" };

export default function PricingPage() {
  const [rooms, setRooms] = useState([]);
  const [prices, setPrices] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    callGas(GAS_ACTIONS.GET_ROOM_TYPES).then((data) => setRooms(data ?? []));
    callGas(GAS_ACTIONS.LIST_SEASONAL_PRICES).then((data) => setPrices(data ?? []));
  }

  useEffect(load, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await callGas(GAS_ACTIONS.SAVE_SEASONAL_PRICE, {
        ...form,
        price: Number(form.price),
      });
      toast.success("บันทึกราคาเทศกาลแล้ว");
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("ลบราคาเทศกาลนี้?")) return;
    try {
      await callGas(GAS_ACTIONS.DELETE_SEASONAL_PRICE, { id });
      toast.success("ลบแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">ราคาช่วงเทศกาล</h1>

      <form onSubmit={handleSubmit} className="mt-4 max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div>
          <label className="mb-1 block text-sm text-stone-600">ประเภทห้อง *</label>
          <select
            required
            value={form.roomTypeId}
            onChange={update("roomTypeId")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            <option value="">-- เลือกห้อง --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">ชื่อช่วงเทศกาล *</label>
          <input
            required
            value={form.label}
            onChange={update("label")}
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
              value={form.startDate}
              onChange={update("startDate")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">วันที่สิ้นสุด *</label>
            <input
              required
              type="date"
              value={form.endDate}
              onChange={update("endDate")}
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

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">ห้อง</th>
              <th className="px-4 py-2">ช่วงเทศกาล</th>
              <th className="px-4 py-2">วันที่</th>
              <th className="px-4 py-2">ราคา</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-2">{rooms.find((r) => r.id === p.roomTypeId)?.name ?? p.roomTypeId}</td>
                <td className="px-4 py-2">{p.label}</td>
                <td className="px-4 py-2">
                  {formatDate(p.startDate)} - {formatDate(p.endDate)}
                </td>
                <td className="px-4 py-2">{formatCurrency(p.price)}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {prices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  ยังไม่มีราคาช่วงเทศกาล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
