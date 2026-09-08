"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AdminIndexPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!session) return;
    router.replace(session.role === "owner" ? "/admin/dashboard" : "/admin/checkin");
  }, [session, router]);

  return <div className="p-8 text-stone-400">กำลังนำทาง...</div>;
}
