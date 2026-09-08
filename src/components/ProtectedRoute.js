"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Wrap any admin page: redirects to /login unless the session role matches. */
export default function ProtectedRoute({ roles, children }) {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(session.role)) {
      router.replace("/admin");
    }
  }, [ready, session, roles, router]);

  if (!ready || !session || (roles && !roles.includes(session.role))) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-stone-400">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  return children;
}
