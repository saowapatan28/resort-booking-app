"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const ALL_LINKS = [
  { href: "/admin/checkin", label: "🔑 Check-in", roles: ["admin", "owner"] },
  { href: "/admin/checkout", label: "🚪 Check-out", roles: ["admin", "owner"] },
  { href: "/admin/dashboard", label: "📊 Dashboard", roles: ["owner"] },
  { href: "/admin/bookings", label: "📋 การจองทั้งหมด", roles: ["owner"] },
  { href: "/admin/rooms", label: "🛏️ ห้องพัก", roles: ["owner"] },
  { href: "/admin/pricing", label: "💰 ราคาเทศกาล", roles: ["owner"] },
  { href: "/admin/gallery", label: "🖼️ Gallery / Logo", roles: ["owner"] },
  { href: "/admin/users", label: "👤 ผู้ดูแลระบบ", roles: ["owner"] },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const links = ALL_LINKS.filter((l) => l.roles.includes(session?.role));

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-stone-200 bg-white md:h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="border-b border-stone-100 p-4">
        <p className="text-sm text-stone-400">เข้าสู่ระบบเป็น</p>
        <p className="font-semibold text-stone-800">{session?.displayName || session?.username}</p>
        <p className="text-xs uppercase tracking-wide text-teal-700">{session?.role}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              pathname?.startsWith(l.href)
                ? "bg-teal-700 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <button
        onClick={() => {
          logout();
          router.replace("/login");
        }}
        className="m-3 rounded-lg border border-stone-200 py-2 text-sm font-medium text-stone-500 hover:bg-stone-100"
      >
        ออกจากระบบ
      </button>
    </aside>
  );
}
