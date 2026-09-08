import { BOOKING_STATUS, BOOKING_STATUS_LABEL } from "@/lib/constants";

const COLORS = {
  [BOOKING_STATUS.PENDING_SLIP]: "bg-amber-100 text-amber-800",
  [BOOKING_STATUS.PENDING_REVIEW]: "bg-blue-100 text-blue-800",
  [BOOKING_STATUS.CONFIRMED]: "bg-emerald-100 text-emerald-800",
  [BOOKING_STATUS.REJECTED]: "bg-red-100 text-red-800",
  [BOOKING_STATUS.CHECKED_IN]: "bg-teal-100 text-teal-800",
  [BOOKING_STATUS.CHECKED_OUT]: "bg-stone-200 text-stone-700",
  [BOOKING_STATUS.CANCELLED]: "bg-red-100 text-red-700 line-through",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
        COLORS[status] || "bg-stone-100 text-stone-700"
      }`}
    >
      {BOOKING_STATUS_LABEL[status] || status}
    </span>
  );
}
