"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // backend hash รหัสผ่านให้เองฝั่ง server (md5(password) เทียบกับ password_hash
      // ในชีต users) — ส่งรหัสผ่านดิบไปตรงๆ ผ่าน HTTPS ไม่ต้อง hash ที่ browser ก่อน
      const result = await callGas(GAS_ACTIONS.LOGIN, { username, password });
      login({
        token: result.token,
        username,
        role: result.role,
        displayName: result.full_name,
      });
      toast.success(`ยินดีต้อนรับ ${result.full_name || username}`);
      router.push("/admin");
    } catch (err) {
      toast.error(err.message || "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-1 flex-col justify-center px-4">
        <h1 className="text-2xl font-bold text-stone-800">เข้าสู่ระบบเจ้าหน้าที่</h1>
        <p className="mt-1 text-sm text-stone-500">สำหรับ Admin และ Owner เท่านั้น</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-6">
          <div>
            <label className="mb-1 block text-sm text-stone-600">Username</label>
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal-700 py-2.5 font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </main>
    </>
  );
}
