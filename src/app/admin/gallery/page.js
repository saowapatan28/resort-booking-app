"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas, fileToDataUrl } from "@/lib/gasClient";
import { GAS_ACTIONS } from "@/lib/constants";

export default function GalleryAdminPage() {
  const [gallery, setGallery] = useState([]);
  const [resortInfo, setResortInfo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  function load() {
    callGas(GAS_ACTIONS.GET_GALLERY).then((data) => setGallery(data ?? []));
    callGas(GAS_ACTIONS.GET_RESORT_INFO).then(setResortInfo);
  }

  useEffect(load, []);

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        await callGas(GAS_ACTIONS.SAVE_GALLERY_IMAGE, { fileName: file.name, dataUrl });
      }
      toast.success("อัพโหลดรูปแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(id) {
    if (!confirm("ลบรูปนี้?")) return;
    try {
      await callGas(GAS_ACTIONS.DELETE_GALLERY_IMAGE, { id });
      toast.success("ลบแล้ว");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const updated = await callGas(GAS_ACTIONS.SAVE_RESORT_INFO, { logoDataUrl: dataUrl });
      setResortInfo(updated);
      toast.success("อัพโหลดโลโก้แล้ว");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const updated = await callGas(GAS_ACTIONS.SAVE_RESORT_INFO, resortInfo);
      setResortInfo(updated);
      toast.success("บันทึกข้อมูลรีสอร์ทแล้ว");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingInfo(false);
    }
  }

  const update = (key) => (e) => setResortInfo((f) => ({ ...f, [key]: e.target.value }));

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">Gallery / Logo / ข้อมูลรีสอร์ท</h1>

      {resortInfo && (
        <form onSubmit={handleSaveInfo} className="mt-4 max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-800">ข้อมูลรีสอร์ท</p>
          <div className="flex items-center gap-4">
            {resortInfo.logoUrl && (
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                <Image src={resortInfo.logoUrl} alt="logo" fill unoptimized className="object-contain" />
              </div>
            )}
            <div>
              <label className="block text-sm text-stone-600">โลโก้</label>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">ชื่อรีสอร์ท</label>
            <input
              value={resortInfo.name || ""}
              onChange={update("name")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">รายละเอียด</label>
            <textarea
              value={resortInfo.description || ""}
              onChange={update("description")}
              rows={2}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-stone-600">ที่อยู่</label>
            <input
              value={resortInfo.address || ""}
              onChange={update("address")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm text-stone-600">โทรศัพท์</label>
              <input
                value={resortInfo.phone || ""}
                onChange={update("phone")}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-600">อีเมล</label>
              <input
                value={resortInfo.email || ""}
                onChange={update("email")}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-stone-600">Line</label>
              <input
                value={resortInfo.line || ""}
                onChange={update("line")}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingInfo}
            className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:bg-stone-300"
          >
            {savingInfo ? "กำลังบันทึก..." : "บันทึกข้อมูลรีสอร์ท"}
          </button>
        </form>
      )}

      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-stone-800">รูป Gallery</p>
          <label className="cursor-pointer rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">
            {uploading ? "กำลังอัพโหลด..." : "+ เพิ่มรูป"}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((img) => (
            <div key={img.id} className="group relative h-32 overflow-hidden rounded-lg bg-stone-100">
              <Image src={img.url} alt="" fill unoptimized className="object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute right-1 top-1 rounded-full bg-red-600/90 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100"
              >
                ลบ
              </button>
            </div>
          ))}
          {gallery.length === 0 && <p className="col-span-full text-stone-400">ยังไม่มีรูป</p>}
        </div>
      </div>
    </ProtectedRoute>
  );
}
