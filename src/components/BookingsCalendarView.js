"use client";

import { useMemo, useState } from "react";
import { toISODate } from "@/lib/format";

/**
 * Simple month-grid calendar showing how many bookings check in each day.
 * `bookingsByDate` is a map: { "2026-09-08": [{ booking_id, room_id, type_id }, ...] }
 *
 * [แก้] gas/Code.gs ไม่มี action สำหรับดึง "การจองแยกตามวัน" โดยตรง (ของเดิมสมมติ
 * เป็น getBookingsCalendar ซึ่งไม่มีจริง) — หน้า dashboard ดึง getBookings ทั้งหมด
 * แล้วจัดกลุ่มตาม check_in_date เองฝั่ง client แทน และ getBookings ก็ไม่ได้ join
 * ชื่อแขกมาด้วย เลยโชว์ได้แค่เลขที่จอง/เลขห้อง ไม่ใช่ชื่อแขก
 */
export default function BookingsCalendarView({ bookingsByDate = {} }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
  const selectedList = selectedDate ? bookingsByDate[selectedDate] ?? [] : [];

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100"
        >
          ‹
        </button>
        <p className="font-semibold text-stone-800">{monthLabel}</p>
        <button
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          className="rounded px-2 py-1 text-stone-500 hover:bg-stone-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (!day) return <div key={i} />;
          const iso = toISODate(day);
          const count = bookingsByDate[iso]?.length ?? 0;
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={`flex h-14 flex-col items-center justify-center rounded-lg border text-sm ${
                selectedDate === iso
                  ? "border-teal-600 bg-teal-50"
                  : count > 0
                  ? "border-amber-200 bg-amber-50"
                  : "border-stone-100"
              }`}
            >
              <span>{day.getDate()}</span>
              {count > 0 && <span className="text-[10px] font-semibold text-amber-700">{count} จอง</span>}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          <p className="text-sm font-medium text-stone-700">เช็คอินวันที่ {selectedDate}</p>
          {selectedList.length === 0 ? (
            <p className="mt-1 text-sm text-stone-400">ไม่มีการจอง</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm text-stone-600">
              {selectedList.map((b) => (
                <li key={b.booking_id}>
                  <span className="font-mono text-teal-700">{b.booking_id}</span> · ห้อง {b.room_id} (
                  {b.type_id})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
