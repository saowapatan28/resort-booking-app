"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import { callGas } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

// resort_info เป็นชีต key/value ที่ backend คืนมาตรงตามที่เจอในชีตจริง (ดู
// getResortInfo() ใน gas/Code.gs) — คีย์ที่ใช้ด้านล่าง (name, description,
// address, phone, email, line) เป็นชื่อที่คาดว่าน่าจะตรง ถ้าไม่ตรงกับคอลัมน์ A
// จริงในชีต resort_info ให้แก้ตรงนี้ให้ตรงกัน (ดูหน้า /admin/gallery ซึ่ง
// render ฟอร์มแบบไดนามิกตามคีย์จริงที่ backend คืนมา ไว้เทียบได้)
export default function HomePage() {
  const [resortInfo, setResortInfo] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      callGas(GAS_ACTIONS.GET_RESORT_INFO).catch(() => null),
      callGas(GAS_ACTIONS.GET_GALLERY).catch(() => []),
    ]).then(([info, images]) => {
      setResortInfo(info);
      setGallery(images ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <h1 className="text-3xl font-bold text-stone-800">
            {loading ? "กำลังโหลด..." : resortInfo?.name ?? "ยินดีต้อนรับสู่รีสอร์ทของเรา"}
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            {resortInfo?.description ??
              "พักผ่อนท่ามกลางธรรมชาติ พร้อมสิ่งอำนวยความสะดวกครบครัน จองห้องพักออนไลน์ได้ทันที"}
          </p>

          <div className="mt-6">
            <Gallery images={gallery} />
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/rooms"
              className="rounded-lg bg-teal-700 px-6 py-3 font-semibold text-white hover:bg-teal-800"
            >
              ดูห้องพักและจองเลย
            </Link>
            {resortInfo?.line && (
              <a
                href={resortInfo.line}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-stone-300 px-6 py-3 font-semibold text-stone-700 hover:bg-stone-100"
              >
                ติดต่อทาง Line
              </a>
            )}
          </div>
        </section>

        <section className="bg-white py-10">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-xl font-bold text-stone-800">ติดต่อเรา</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 text-sm text-stone-600 sm:grid-cols-3">
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="font-semibold text-stone-800">ที่อยู่</p>
                <p className="mt-1">{resortInfo?.address ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="font-semibold text-stone-800">โทรศัพท์</p>
                <p className="mt-1">{resortInfo?.phone ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-stone-200 p-4">
                <p className="font-semibold text-stone-800">อีเมล</p>
                <p className="mt-1">{resortInfo?.email ?? "-"}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer resortInfo={resortInfo} />
    </>
  );
}
