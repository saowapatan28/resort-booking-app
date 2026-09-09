"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import ProtectedRoute from "@/components/ProtectedRoute";
import { callGas, fileToBase64 } from "@/lib/gasClient";
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
        const { base64, mimeType } = await fileToBase64(file);
        await callGas(GAS_ACTIONS.UPLOAD_DECOR_PHOTO, {
          file_base64: base64,
          file_name: file.name,
          mime_type: mimeType,
        });
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

  // resort_info เป็นชีต key/value ที่ยืดหยุ่น — getResortInfo คืน object ตรงๆ ตามที่
  // เจอในชีต (แปลไม่ได้ว่าคีย์ไหนชื่ออะไรแน่ๆ จากโค้ด backend ต้องดูจากชีตจริง) เลย
  // render ฟอร์มเป็น input ต่อ key ที่ backend คืนมาจริง แทนการเดาชื่อ field ตายตัว
  // [แก้] saveResortInfo อัพเดตได้แค่ key ที่ "มีอยู่แล้ว" ในชีต (แถวใหม่จะไม่ถูกสร้าง)
  const infoKeys = resortInfo ? Object.keys(resortInfo) : [];
  const logoKey = infoKeys.find((k) => k.toLowerCase().includes("logo"));

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !logoKey) return;
    setUploading(true);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const uploaded = await callGas(GAS_ACTIONS.UPLOAD_DECOR_PHOTO, {
        file_base64: base64,
        file_name: file.name,
        mime_type: mimeType,
        caption: "resort logo",
      });
      await callGas(GAS_ACTIONS.SAVE_RESORT_INFO, { fields: { [logoKey]: uploaded.url } });
      setResortInfo((info) => ({ ...info, [logoKey]: uploaded.url }));
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
      await callGas(GAS_ACTIONS.SAVE_RESORT_INFO, { fields: resortInfo });
      toast.success("บันทึกข้อมูลรีสอร์ทแล้ว");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingInfo(false);
    }
  }

  const updateInfo = (key) => (e) => setResortInfo((f) => ({ ...f, [key]: e.target.value }));

  return (
    <ProtectedRoute roles={["owner"]}>
      <h1 className="text-xl font-bold text-stone-800">Gallery / Logo / ข้อมูลรีสอร์ท</h1>

      {resortInfo && (
        <form onSubmit={handleSaveInfo} className="mt-4 max-w-xl space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <p className="font-semibold text-stone-800">ข้อมูลรีสอร์ท</p>

          {logoKey && (
            <div className="flex items-center gap-4">
              {resortInfo[logoKey] && (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                  <Image src={resortInfo[logoKey]} alt="logo" fill unoptimized className="object-contain" />
                </div>
              )}
              <div>
                <label className="block text-sm text-stone-600">โลโก้ ({logoKey})</label>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
              </div>
            </div>
          )}

          {infoKeys.length === 0 && (
            <p className="text-sm text-stone-400">ยังไม่มีข้อมูลในชีต resort_info</p>
          )}
          {infoKeys
            .filter((k) => k !== logoKey)
            .map((key) => (
              <div key={key}>
                <label className="mb-1 block text-sm text-stone-600">{key}</label>
                <input
                  value={resortInfo[key] || ""}
                  onChange={updateInfo(key)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              </div>
            ))}

          <button
            type="submit"
            disabled={savingInfo || infoKeys.length === 0}
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
        {/* [แก้] ไม่มี action "deleteGalleryImage" ใน backend — ตัดปุ่มลบออก
            (ต้องไปลบแถวในชีต gallery โดยตรงไปก่อน) */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {gallery.map((img, i) => (
            <div key={img.gallery_id ?? i} className="relative h-32 overflow-hidden rounded-lg bg-stone-100">
              <Image src={img.image_url ?? img.url} alt={img.caption ?? ""} fill unoptimized className="object-cover" />
            </div>
          ))}
          {gallery.length === 0 && <p className="col-span-full text-stone-400">ยังไม่มีรูป</p>}
        </div>
      </div>
    </ProtectedRoute>
  );
}
