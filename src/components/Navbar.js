"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/rooms", label: "ห้องพัก" },
  { href: "/login", label: "สำหรับเจ้าหน้าที่" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-teal-700">
          🏝️ Resort Booking
        </Link>

        <button
          className="md:hidden rounded p-2 text-stone-600"
          onClick={() => setOpen((v) => !v)}
          aria-label="เปิดเมนู"
        >
          ☰
        </button>

        <ul className="hidden gap-6 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="text-sm font-medium text-stone-700 hover:text-teal-700">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-stone-200 bg-white px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="block rounded px-2 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
