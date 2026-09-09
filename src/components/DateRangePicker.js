"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency, nightsBetween, toISODate } from "@/lib/format";

/**
 * Check-in / check-out picker with live availability + price, driven by the
 * single `checkAvailability` action (gas/Code.gs has no separate "list booked
 * date ranges" endpoint, so we can't grey out unavailable dates up front —
 * we check the chosen range instead, same as createBooking will re-check it).
 * Calls onQuoteChange(null | { check_in, check_out, rooms, available_count,
 * nights, price }) whenever the picked range changes.
 */
export default function DateRangePicker({ typeId, onQuoteChange }) {
  const [range, setRange] = useState([null, null]);
  const [checkIn, checkOut] = range;
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!checkIn || !checkOut || !typeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailability(null);
      onQuoteChange?.(null);
      return;
    }
    setLoading(true);
    const check_in = toISODate(checkIn);
    const check_out = toISODate(checkOut);
    callGas(GAS_ACTIONS.CHECK_AVAILABILITY, { type_id: typeId, check_in, check_out })
      .then((data) => {
        setAvailability(data);
        if (data?.available_count > 0) {
          onQuoteChange?.({ check_in, check_out, ...data });
        } else {
          onQuoteChange?.(null);
        }
      })
      .catch((err) => {
        toast.error(err.message);
        setAvailability(null);
        onQuoteChange?.(null);
      })
      .finally(() => setLoading(false));
  }, [checkIn, checkOut, typeId]); // eslint-disable-line react-hooks/exhaustive-deps

  const nights = nightsBetween(checkIn, checkOut);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <label className="mb-2 block text-sm font-medium text-stone-700">
        เลือกวันเข้าพัก - วันออก
      </label>
      <DatePicker
        selectsRange
        startDate={checkIn}
        endDate={checkOut}
        onChange={(dates) => setRange(dates)}
        minDate={new Date()}
        monthsShown={2}
        inline
      />

      <div className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>จำนวนคืน</span>
          <span>{nights} คืน</span>
        </div>
        {loading && <p className="text-xs text-stone-400">กำลังตรวจสอบห้องว่าง...</p>}
        {availability && (
          <div className="flex justify-between text-stone-600">
            <span>ห้องว่าง</span>
            <span className={availability.available_count > 0 ? "text-emerald-600" : "text-red-600"}>
              {availability.available_count > 0
                ? `ว่าง ${availability.available_count} ห้อง`
                : "ไม่มีห้องว่างช่วงนี้"}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-teal-700">
          <span>ราคารวม</span>
          <span>{availability?.price ? formatCurrency(availability.price) : "-"}</span>
        </div>
      </div>
    </div>
  );
}
