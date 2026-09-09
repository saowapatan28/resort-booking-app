# Resort Booking — Project Notes

สรุปสถานะโปรเจกต์ล่าสุด (อัปเดต 2026-09-09) ใช้ไฟล์นี้เป็นจุดเริ่มคุยต่อรอบหน้า
ไม่ว่าจะเปิดจากเครื่องไหนหรือแชทไหน

## ลิงก์สำคัญ

| อะไร | ที่ไหน |
|---|---|
| โค้ด (GitHub) | https://github.com/saowapatan28/resort-booking-app *(ยังเป็น public — ต้องไป Settings → Change visibility → Private)* |
| ฐานข้อมูล (Google Sheet) | `resort_management_schema` — https://docs.google.com/spreadsheets/d/1HjGohA9BcYlce9-LPuBxBByfu7vwlqkjYsQtuvN57s0 |
| Backend (Apps Script) | Bound script บนชีตด้านบน (Extensions → Apps Script) → `gas/Code.gs` ในโปรเจกต์นี้คือ source of truth |
| GAS Web App URL (`/exec`) | เก็บใน `.env.local` → `GAS_API_URL` (ไม่ได้ push ขึ้น GitHub — ต้องตั้งเองทุกเครื่อง) |

## สถานะปัจจุบัน

- ✅ Next.js (App Router + Tailwind) scaffold ครบทุกหน้า: หน้าบ้านลูกค้า (จอง/สลิป/เซ็นเอกสาร) + หลังบ้าน admin/owner (checkin/checkout/dashboard/จัดการห้อง/ราคา/user/gallery)
- ✅ `gas/Code.gs` (เวอร์ชันที่คุณเขียน+ผมรีวิวแก้บั๊กแล้ว) ตรงกับ schema จริงในชีต 11 แท็บ
- ✅ Login ทดสอบผ่านแล้ว (ยิงตรงไปที่ GAS URL) — username `owner01` / password `Resort2026!` (**ควรเปลี่ยนเป็นรหัสจริงของคุณ** ดูวิธีด้านล่าง)
- ⚠️ **`/exec` ที่ deploy ใช้งานจริงตอนนี้ยังเป็นโค้ดเวอร์ชันเก่า** (ก่อนแก้บั๊กทั้งหมด) — ยังไม่ได้กด "New version" ที่ Deploy → Manage deployments — **ต้องทำก่อนใช้งานจริง**
- ⚠️ **Next.js frontend กับ backend ยังคุยกันไม่ครบทุก action** — แก้ไปแล้วเฉพาะ `login` (ดูรายละเอียดด้านล่าง) หน้าอื่นๆ (จองห้อง, ดู dashboard, จัดการห้อง/ราคา, checkin/checkout ฯลฯ) ยังเรียก action/field คนละชื่อกับ backend อยู่ ต้องไล่แก้ทีละหน้า

## บั๊กที่เจอและแก้แล้วใน `gas/Code.gs`

1. `updateCheckinField()` ค้นแถวผิดคอลัมน์ → checkout/เซ็นเอกสาร/บันทึก PDF เคยไม่เซฟอะไรเลยแบบเงียบๆ
2. `getBookedRooms()` ไม่นับสถานะ `check-in` → ห้องที่แขกพักอยู่จริงโดนจองซ้ำได้
3. `verifySlip`/`confirmBooking`/`cancelBooking` ไม่ได้บังคับสิทธิ์ owner → admin ธรรมดาก็ยืนยัน/ยกเลิก+คืนเงินได้
4. Session token ปลอมได้ (base64 เฉยๆ ไม่มี signature) → เปลี่ยนเป็นเซ็น HMAC-SHA256 ด้วย `CONFIG.SECRET_KEY`
5. รูปสลิป/กุญแจ/ลายเซ็นใช้ `getUrl()` (ไม่ใช่ direct image URL + ไม่ set sharing) → รวมเป็น `uploadFileToFolder()` ใช้ `uc?id=` + set sharing ให้ทุกไฟล์
6. Folder ID เคย hardcode ซ้ำกับที่มีอยู่แล้วในชีต `drive_folders` → เปลี่ยนเป็นอ่านจากชีตผ่าน `getFolderId()`
7. จุดเล็กๆ: `isTrue()` กัน active เป็น checkbox จริง, `saveUser` บังคับใส่ password ตอนสร้างใหม่, `getDashboard` นับเฉพาะห้อง active, `normDate()` กัน Google Sheets แปลงวันที่เป็น Date object เอง
8. เพิ่ม action ใหม่ `getBookingStatus` (public) ให้ลูกค้าเช็คสถานะจองด้วย booking_id เฉยๆ โดยไม่ต้อง login

## บั๊กที่เจอและแก้แล้วฝั่ง Next.js

- `src/lib/gasClient.js`: เดิมห่อข้อมูลส่งไปเป็น `{ action, payload: {...}, token }` แต่ backend รอรับฟิลด์แบบแบนที่ระดับบนสุด (`{ action, username, password, ... }`) → แก้ให้ spread payload ขึ้นมาระดับบนสุด และรองรับ response ทั้ง 2 แบบที่ backend ตอบกลับปนกัน (บาง action ห่อใน `data`, บาง action คืนฟิลด์ตรงๆ เช่น `login`)
- `src/app/login/page.js`: เดิม hash รหัสผ่านที่ browser ก่อนส่ง (`passwordHash`) แต่ backend รอรับรหัสผ่านดิบ (`password`) แล้วไป hash เองฝั่ง server → แก้ให้ส่ง `password` ตรงๆ

## ✅ ปรับ action/field name ฝั่ง Next.js ให้ตรงกับ gas/Code.gs แล้ว (2026-09-09)

ไล่แก้ทุกหน้า/component ที่เรียก `callGas()` ให้ใช้ action name + field name ตรงกับ
`case` และ destructured fields ใน `gas/Code.gs` จริง (ไม่ใช่ชื่อ camelCase ที่ mock
ไว้แต่แรกอีกต่อไป) — ดู `src/lib/constants.js` (`GAS_ACTIONS`, `PAYMENT_STATUS`,
`BOOKING_STATUS`) เป็น source of truth ฝั่ง frontend ตอนนี้

สิ่งที่ backend ยังไม่รองรับเลย เลยต้องปรับ UX ให้ทำได้เท่าที่มีจริงไปก่อน (ดู
comment `[แก้]` ในโค้ดแต่ละจุด):
- **ลบ**: ไม่มี `deleteRoomType`/`deleteSeasonalPrice`/`deleteAdminUser`/`deleteGalleryImage`
  → หน้าห้องพัก/ผู้ใช้ใช้ "ปิดใช้งาน" (`active:false` ผ่าน `saveRoomType`/`saveUser`) แทน,
  ราคาเทศกาล/รูป gallery ตัดปุ่มลบออกไปเลย (ต้องลบในชีตตรงๆ)
- **ราคาเทศกาล**: ไม่มี `listSeasonalPrices` → หน้า `/admin/pricing` เหลือแค่ฟอร์มเพิ่ม อย่างเดียว ดูรายการที่มีอยู่ในชีต `seasonal_pricing` ตรงๆ
- **ปฏิทิน dashboard**: ไม่มี `getBookingsCalendar` → ดึง `getBookings` ทั้งหมดมาจัดกลุ่ม
  ตาม `check_in_date` เองฝั่ง client (ไม่มีชื่อแขกในนั้น เพราะ `getBookings` ไม่ join guest)
- **เช็คอิน/เอาท์วันนี้**: ไม่มี `listTodayTasks` → ใช้ `getBookings` กรอง status +
  วันที่แทน (check-out ต้อง filter ฝั่ง client เพราะ backend กรองวันที่ได้แค่ check_in_date)
- **เซ็นเอกสารหน้างาน**: ไม่มี action แยกสำหรับเซ็น onsite → ฝัง signature ลง PDF
  ที่สร้างฝั่ง client แล้วเซฟผ่าน `generatePDF` ตัวเดียว (คนละ path กับเซ็นทางไกล
  ผ่านลิงก์ที่ใช้ `submitSignature` — สองทางนี้ยังไม่คุยกัน เอกสารที่เซ็นทางไกล
  ยังไม่มีทางสร้าง PDF ให้อัตโนมัติ เพราะ `generatePDF` ต้อง auth เป็น admin/owner)
- **ข้อมูลรีสอร์ท**: `resort_info` เป็นชีต key/value อิสระ ไม่รู้ชื่อคอลัมน์แน่ชัดจากโค้ด
  → หน้า `/admin/gallery` render ฟอร์มตามคีย์จริงที่ `getResortInfo` คืนมาแทนการ
  เดาชื่อ field (หน้าแรก/`Footer` ยังเดาชื่อคีย์ทั่วไปอยู่ — เช็ค comment ในไฟล์)
- **รูปห้องพัก**: ไม่มี action อัพโหลดรูปห้องพักโดยเฉพาะ → ใช้ `uploadDecorPhoto`
  (ผลข้างเคียง: รูปจะไปโผล่ในชีต `gallery` ด้วย)

ยังไม่ได้แตะ `gas/Code.gs` เพิ่มเติมในรอบนี้ — ของที่ backend ยังไม่รองรับข้างบน
ถ้าจะทำให้ครบจริงต้องกลับไปเพิ่ม action ใน `Code.gs` ก่อน

## ยังไม่ได้ทำ (ของที่คุยค้างไว้)

- [ ] Redeploy `gas/Code.gs` เวอร์ชันล่าสุด → Deploy → Manage deployments → New version
- [ ] เปลี่ยนรหัสผ่าน owner01 จาก `Resort2026!` เป็นรหัสจริง (วิธีอยู่ในแชทก่อนหน้า: รันฟังก์ชัน `md5()` ใน Apps Script editor)
- [ ] เปลี่ยน `resort-booking-app` บน GitHub จาก public → private
- [ ] เปลี่ยน `CONFIG.SECRET_KEY` ใน `Code.gs` จาก placeholder เป็นสตริงสุ่มจริงก่อน deploy
- [ ] แก้ `sendSignLink()` ที่ยัง hardcode โดเมนเป็น `your-vercel-app.vercel.app` ให้เป็นโดเมนจริงตอน deploy เว็บ

## แผนต่อไปที่คุยกันไว้

พรุ่งนี้: ลองเข้าหน้า owner เพื่อใส่รูป/ตั้งราคาห้องพัก (ต้อง redeploy `Code.gs` ก่อน ไม่งั้น bug เก่ายังอยู่)
