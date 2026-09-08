"use client";

import md5 from "js-md5";
import { SESSION_STORAGE_KEY } from "./constants";

/** Hash a password the same way the GAS backend stores it (MD5). */
export function hashPassword(rawPassword) {
  return md5(rawPassword);
}

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
