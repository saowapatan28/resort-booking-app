# ระบบจองรีสอร์ท (Resort Booking System)

Next.js (App Router) + Tailwind CSS สำหรับหน้าบ้าน (ลูกค้า) และหลังบ้าน (admin/owner)
โดยใช้ Google Apps Script (GAS) + Google Sheets + Google Drive เป็น backend

## Stack

- **Next.js 15** (App Router, JavaScript, `src/` dir)
- **Tailwind CSS v4**
- `react-datepicker` — ปฏิทินเลือกวันเข้า/ออก
- `react-signature-canvas` — ลายเซ็นดิจิทัล
- `jspdf` — สร้าง PDF เอกสาร check-in/check-out ฝั่ง client
- `js-md5` — hash รหัสผ่านก่อนส่งไป backend
- `react-hot-toast` — แจ้งเตือน UI

## โครงสร้างโปรเจกต์

```
src/
  app/
    page.js                     หน้าแรก (gallery, ข้อมูลติดต่อ)
    rooms/                      รายการห้องพัก + รายละเอียด/จอง
    booking/[bookingId]/        หน้าสถานะการจอง
    sign/[token]/               หน้าเซ็นเอกสาร (ลูกค้าเปิดจากลิงก์อีเมล)
    login/                      เข้าสู่ระบบ admin/owner
    admin/
      layout.js                 guard + sidebar
      checkin/, checkout/       งานประจำวันของ admin
      dashboard/                สรุปรายได้ / occupancy / ปฏิทินจอง (owner)
      bookings/                 รายการจองทั้งหมด + ตรวจสลิป + ยกเลิก/คืนเงิน (owner)
      rooms/, pricing/          จัดการห้องพัก + ราคาเทศกาล (owner)
      users/, gallery/          จัดการผู้ดูแลระบบ + gallery/logo (owner)
    api/gas/route.js            proxy ไปยัง Google Apps Script (ซ่อน URL จริงจาก client)
  components/                   UI components ที่ใช้ร่วมกัน
  lib/
    constants.js                รายชื่อ action ทั้งหมดที่คุยกับ GAS (API contract)
    gasClient.js                helper เรียก /api/gas จากฝั่ง client
    auth.js                     md5 hash + session ใน localStorage
    pdf.js, signatureStamp.js   สร้าง PDF / stamp เวลา+GPS บนลายเซ็น
    geo.js, format.js           GPS + formatting utilities
  context/AuthContext.js        React context เก็บ session ที่ login แล้ว
gas/
  Code.gs                       โค้ด Apps Script ตัวอย่าง (ครบทุก action)
  SETUP.md                      วิธี deploy backend
```

## เริ่มต้นใช้งาน

```bash
npm install
cp .env.example .env.local   # แล้วใส่ GAS_API_URL ของจริง
npm run dev
```

เปิด http://localhost:3000

## ตั้งค่า Backend (GAS)

ดูขั้นตอนละเอียดที่ [`gas/SETUP.md`](./gas/SETUP.md) — สรุปคือ:

1. สร้าง Google Sheet ใหม่ ใส่ Spreadsheet ID ลงใน `gas/Code.gs`
2. วางโค้ด `gas/Code.gs` ใน Apps Script editor ของ Sheet นั้น
3. รัน `setupSheets()` หนึ่งครั้งเพื่อสร้างชีต + owner user เริ่มต้น
4. Deploy เป็น Web App (Execute as: Me, Access: Anyone) แล้วคัดลอก URL `/exec`
5. ใส่ URL นั้นใน `.env.local` → `GAS_API_URL`

โฟลเดอร์ Google Drive ที่ backend ใช้เก็บไฟล์ (กำหนดไว้แล้วใน `Code.gs` และ `.env.local`):

| โฟลเดอร์ | Folder ID |
|---|---|
| รูปตกแต่ง/gallery | `12wfjEanZkv3jxxOEV0UoQy3LUHNXXnnv` |
| สลิปโอนเงิน | `1xXoSlPNIIZsExQrSDoxfp4suvkpjF4WO` |
| รูปดิบ (กุญแจ/ลายเซ็น) | `15pl07G1Hokar00cep5J8_dZR5JhnmLeB` |
| PDF เอกสาร | `18Au7WyUrB7GdRQ-I5KOkV3_MdPd02Nen` |

## API Contract

Frontend เรียก backend ผ่าน `POST /api/gas` เท่านั้น (ไม่เรียก `script.google.com` ตรงๆ)
ด้วย body `{ action, payload, token }` — รายชื่อ action ทั้งหมดอยู่ที่
`src/lib/constants.js` (`GAS_ACTIONS`) และมี handler ตรงกันใน `gas/Code.gs`
เพิ่ม action ใหม่ต้องแก้ทั้งสองที่ให้ตรงกัน

## Role การเข้าถึง

| Role | สิทธิ์ |
|---|---|
| `customer` | ไม่ต้อง login — ดูห้อง/ราคา/ปฏิทิน, จอง, อัพโหลดสลิป, เซ็นเอกสารจากลิงก์ |
| `admin` | login แล้วเข้าถึง `/admin/checkin`, `/admin/checkout` |
| `owner` | เข้าถึงทุกหน้าใน `/admin/*` รวม dashboard และการตั้งค่าต่างๆ |

## หมายเหตุ

- ลายเซ็นทุกใบจะถูก stamp วันเวลา + พิกัด GPS ทับก่อนอัพโหลด (`lib/signatureStamp.js`)
- PDF เอกสาร check-in/check-out ถูกสร้างฝั่ง client ด้วย `jsPDF` แล้วส่ง base64 ไปให้ backend เก็บลง Drive
- รูปภาพทั้งหมด (gallery, ห้องพัก, สลิป, กุญแจ) ถูกส่งเป็น base64 data URL ผ่าน JSON — ไม่ได้ใช้ multipart form
