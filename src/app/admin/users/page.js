"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, ROLES } from "@/lib/constants";
import { isActiveValue } from "@/lib/format";

// [แก้] ฟิลด์ตรงกับ saveUser()/getUsers() ใน gas/Code.gs (snake_case, full_name
// ไม่ใช่ displayName, password ไม่ใช่ passwordHash — backend hash เองด้วย md5())
const emptyForm = { username: "", full_name: "", phone: "", password: "", role: ROLES.ADMIN };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    callGas(GAS_ACTIONS.GET_USERS).then((data) => setUsers(data ?? []));
  }

  useEffect(load, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await callGas(GAS_ACTIONS.SAVE_USER, {
        username: form.username,
        full_name: form.full_name,
        phone: form.phone,
        role: form.role,
        password: form.password || undefined, // ผู้ใช้ใหม่ backend บังคับต้องมี
        active: "TRUE",
      });
      toast.success("บันทึกผู้ใช้แล้ว");
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  // [แก้] ไม่มี action "deleteAdminUser" — ใช้ saveUser เซฟทั้งแถวเดิมซ้ำ พร้อม
  // ตั้ง active เป็น FALSE แทน (ไม่ส่ง password ไปด้วย เพื่อไม่ให้รหัสผ่านเดิมหาย)
  async function handleToggleActive(u) {
    const nextActive = !isActiveValue(u.active);
    if (!confirm(`${nextActive ? "เปิด" : "ปิด"}ใช้งานผู้ใช้ ${u.username}?`)) return;
    try {
      await callGas(GAS_ACTIONS.SAVE_USER, {
        user_id: u.user_id,
        username: u.username,
        full_name: u.full_name,
        phone: u.phone,
        role: u.role,
        active: nextActive ? "TRUE" : "FALSE",
      });
      toast.success("บันทึกแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">จัดการผู้ดูแลระบบ</h1>

      <form onSubmit={handleSubmit} className="mt-4 max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-stone-600">Username *</label>
            <input
              required
              value={form.username}
              onChange={update("username")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">ชื่อที่แสดง</label>
            <input
              value={form.full_name}
              onChange={update("full_name")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-stone-600">เบอร์โทร</label>
            <input
              value={form.phone}
              onChange={update("phone")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">สิทธิ์</label>
            <select
              value={form.role}
              onChange={update("role")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            >
              <option value={ROLES.ADMIN}>admin</option>
              <option value={ROLES.OWNER}>owner</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-stone-600">รหัสผ่าน (ผู้ใช้ใหม่ต้องระบุ)</label>
          <input
            type="password"
            value={form.password}
            onChange={update("password")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
        >
          {saving ? "กำลังบันทึก..." : "เพิ่มผู้ใช้"}
        </button>
        <p className="text-xs text-stone-400">
          หมายเหตุ: ฟอร์มนี้ใช้เพิ่มผู้ใช้ใหม่เท่านั้น การแก้ไขผู้ใช้เดิม (เช่นเปลี่ยนรหัสผ่าน)
          ยังไม่มี UI แยก — ต้องเรียก saveUser พร้อม user_id เดิมเอง
        </p>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">ชื่อที่แสดง</th>
              <th className="px-4 py-2">สิทธิ์</th>
              <th className="px-4 py-2">สถานะ</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-2 font-mono">{u.username}</td>
                <td className="px-4 py-2">{u.full_name}</td>
                <td className="px-4 py-2 uppercase text-teal-700">{u.role}</td>
                <td className="px-4 py-2">{isActiveValue(u.active) ? "เปิดใช้งาน" : "ปิดใช้งาน"}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleToggleActive(u)} className="text-red-600 hover:underline">
                    {isActiveValue(u.active) ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  ยังไม่มีผู้ใช้
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProtectedRoute>
  );
}
