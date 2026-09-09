"use client";

import { SESSION_STORAGE_KEY } from "./constants";

// [แก้] เดิมมี hashPassword() ให้ browser แฮชรหัสผ่านเป็น MD5 เองก่อนส่ง แต่
// login()/saveUser() ฝั่ง gas/Code.gs รอรับรหัสผ่านดิบแล้วไป md5() เองที่ server
// (ดู CLAUDE.md/PROJECT_NOTES.md) — ฟังก์ชันนี้เลยไม่มีที่ใช้แล้ว ตัดออกไปเลย
// เพื่อไม่ให้เผลอเอามาใช้ผิดจุดอีก

/** Persist the logged-in admin/owner session in localStorage. */
export function saveSession(session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/** Read the current session ({ token, username, role, displayName }) or null. */
export function getSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isLoggedIn() {
  return !!getSession()?.token;
}

export function hasRole(...roles) {
  const session = getSession();
  return !!session && roles.includes(session.role);
}

export function isOwner() {
  return hasRole("owner");
}
