export default function Footer({ resortInfo }) {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-100">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-stone-600">
        <p className="font-semibold text-stone-800">
          {resortInfo?.name ?? "ชื่อรีสอร์ท"}
        </p>
        <p className="mt-1">{resortInfo?.address ?? "ที่อยู่รีสอร์ท"}</p>
        <p className="mt-1">
          โทร: {resortInfo?.phone ?? "-"} · Line: {resortInfo?.line ?? "-"} · Email:{" "}
          {resortInfo?.email ?? "-"}
        </p>
        <p className="mt-4 text-xs text-stone-400">
          © {new Date().getFullYear()} {resortInfo?.name ?? "Resort"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
