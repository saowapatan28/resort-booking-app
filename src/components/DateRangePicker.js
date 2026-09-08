"use client";

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";
import { formatCurrency, nightsBetween, toISODate } from "@/lib/format";

/**
 * Check-in / check-out picker with live availability + auto price quote.
 * Calls onQuoteChange({ checkIn, checkOut, nights, total, breakdown }) whenever
 * a valid range is selected and priced.
 */
export default function DateRangePicker({ roomTypeId, basePrice, onQuoteChange }) {
  const [range, setRange] = useState([null, null]);
  const [checkIn, checkOut] = range;
  const [bookedRanges, setBookedRanges] = useState([]);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  useEffect(() => {
    if (!roomTypeId) return;
    callGas(GAS_ACTIONS.GET_ROOM_AVAILABILITY, { roomTypeId })
      .then((data) => setBookedRanges(data?.bookedRanges ?? []))
      .catch(() => setBookedRanges([]));
  }, [roomTypeId]);

  const excludedIntervals = useMemo(
    () =>
      bookedRanges.map((r) => ({
        start: new Date(r.start),
        end: new Date(r.end),
      })),
    [bookedRanges]
  );

  useEffect(() => {
    if (!checkIn || !checkOut) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuote(null);
      onQuoteChange?.(null);
      return;
    }
    setLoadingQuote(true);
    callGas(GAS_ACTIONS.QUOTE_PRICE, {
      roomTypeId,
      checkIn: toISODate(checkIn),
      checkOut: toISODate(checkOut),
    })
      .then((data) => {
        setQuote(data);
        onQuoteChange?.({
          checkIn: toISODate(checkIn),
          checkOut: toISODate(checkOut),
          ...data,
        });
      })
      .catch((err) => {
        toast.error(err.message);
        setQuote(null);
        onQuoteChange?.(null);
      })
      .finally(() => setLoadingQuote(false));
  }, [checkIn, checkOut, roomTypeId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        excludeDateIntervals={excludedIntervals}
        monthsShown={2}
        inline
      />

      <div className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>จำนวนคืน</span>
          <span>{nights} คืน</span>
        </div>
        <div className="flex justify-between text-stone-600">
          <span>ราคาปกติ / คืน</span>
          <span>{formatCurrency(basePrice)}</span>
        </div>
        {loadingQuote && <p className="text-xs text-stone-400">กำลังคำนวณราคา...</p>}
        {quote?.hasFestivalNights && (
          <p className="text-xs font-medium text-amber-600">
            * มีบางคืนเป็นราคาช่วงเทศกาล
          </p>
        )}
        <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-bold text-teal-700">
          <span>ราคารวม</span>
          <span>{quote ? formatCurrency(quote.total) : "-"}</span>
        </div>
      </div>
    </div>
  );
}
