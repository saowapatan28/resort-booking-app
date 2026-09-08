"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS, ROLES } from "@/lib/constants";
import { hashPassword } from "@/lib/auth";

const emptyForm = { username: "", displayName: "", password: "", role: ROLES.ADMIN };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    callGas(GAS_ACTIONS.LIST_ADMIN_USERS).then((data) => setUsers(data ?? []));
  }

  useEffect(load, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await callGas(GAS_ACTIONS.SAVE_ADMIN_USER, {
        username: form.username,
        displayName: form.displayName,
        role: form.role,
        passwordHash: form.password ? hashPassword(form.password) : undefined,
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

  async function handleDelete(username) {
    if (!confirm(`ลบผู้ใช้ ${username}?`)) return;
    try {
      await callGas(GAS_ACTIONS.DELETE_ADMIN_USER, { username });
      toast.success("ลบแล้ว");
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
              value={form.displayName}
              onChange={update("displayName")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-stone-600">รหัสผ่าน (เว้นว่างถ้าไม่เปลี่ยน)</label>
            <input
              type="password"
              value={form.password}
              onChange={update("password")}
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
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
        >
          {saving ? "กำลังบันทึก..." : "บันทึกผู้ใช้"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-stone-500">
            <tr>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">ชื่อที่แสดง</th>
              <th className="px-4 py-2">สิทธิ์</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} className="border-b border-stone-50 last:border-0">
                <td className="px-4 py-2 font-mono">{u.username}</td>
                <td className="px-4 py-2">{u.displayName}</td>
                <td className="px-4 py-2 uppercase text-teal-700">{u.role}</td>
                <td className="px-4 py-2">
                  <button onClick={() => handleDelete(u.username)} className="text-red-600 hover:underline">
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
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
