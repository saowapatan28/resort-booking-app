import { formatCurrency } from "@/lib/format";

// [แก้] ฟิลด์ตรงกับที่ getDashboard() ใน gas/Code.gs คืนจริง (snake_case)
export default function DashboardStats({ summary }) {
  const cards = [
    { label: "รายได้วันนี้", value: formatCurrency(summary?.revenue_today), accent: "text-teal-700" },
    { label: "รายได้เดือนนี้", value: formatCurrency(summary?.revenue_month), accent: "text-teal-700" },
    { label: "Occupancy Rate", value: `${summary?.occupancy_rate ?? 0}%`, accent: "text-amber-600" },
    { label: "รอยืนยัน", value: summary?.pending ?? 0, accent: "text-red-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">{c.label}</p>
          <p className={`mt-1 text-2xl font-bold ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
