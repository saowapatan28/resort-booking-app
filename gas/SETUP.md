# ตั้งค่า Google Apps Script Backend

`gas/Code.gs` เป็น **container-bound script** — ต้องแปะไว้ใน Apps Script ของ
Google Sheet `resort_management_schema` โดยตรง (ใช้ `SpreadsheetApp.getActiveSpreadsheet()`
ไม่ได้อ้าง Spreadsheet ID แยก)

## ขั้นตอน

1. เปิด Google Sheet `resort_management_schema` → **Extensions → Apps Script**
2. วางโค้ดทั้งหมดจาก `gas/Code.gs` (ทับของเดิมถ้ามี)
3. แก้ค่าใน `CONFIG` ที่ด้านบนไฟล์:
   - **`SECRET_KEY`** — ⚠️ ต้องเปลี่ยนเป็นสตริงสุ่มยาวๆ ก่อน deploy จริง (ใช้เซ็น session token —
     ถ้าไม่เปลี่ยนจากค่า placeholder ใครก็เดา/ปลอม token เป็น owner ได้)
   - `ADMIN_EMAIL` — ตั้งเป็นอีเมลที่จะรับแจ้งเตือนสลิปใหม่แล้ว
   - **ไม่ต้องแก้ folder ID ในโค้ด** — โค้ดอ่านจากชีต `drive_folders` (คอลัมน์ `folder_key`,
     `folder_url`) ผ่าน `getFolderId()` โดยตรง ถ้าจะย้าย/เปลี่ยนโฟลเดอร์ในอนาคต แก้ที่แถวในชีตนี้
     พอ ไม่ต้องมาแก้โค้ดซ้ำ — แค่ต้องคง `folder_key` เป็น `decor` / `slip` / `upload` / `pdf`
     ตามเดิม เพราะโค้ดอ้างอิงด้วยชื่อนี้
4. ตรวจว่าแท็บ (ชื่อชีต) ตรงกับที่โค้ดอ้างอิงในอ็อบเจ็กต์ `SHEET`:
   `drive_folders`, `resort_info`, `gallery`, `room_types`, `rooms`, `seasonal_pricing`,
   `bookings`, `guests`, `checkin_checkout`, `users`, `sign_links`
   (ชื่อพวกนี้ตรงกับแท็บที่มีอยู่แล้วในชีตของคุณ — ถ้า rename แท็บ ต้องแก้ `SHEET` ในโค้ดให้ตรงด้วย)
5. ตั้งค่า **Project Settings → Time zone** เป็น `Asia/Bangkok` (โค้ดใช้ `Session.getScriptTimeZone()`
   ในการฟอร์แมตวันที่ทุกจุด ถ้า timezone ผิดจะกระทบการเช็ควันเข้า-ออกทั้งระบบ)
6. รัน `setupTriggers()` หนึ่งครั้ง (เลือกจาก dropdown แล้วกด Run) เพื่อตั้ง auto-delete
   รูปดิบที่อายุเกิน 6 เดือน ทุกวันอาทิตย์ตี 2 — ครั้งแรกจะขอ authorize สิทธิ์ Drive/Trigger
7. Deploy → New deployment → เลือกประเภท **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL ที่ลงท้ายด้วย `/exec`
8. นำ URL นั้นไปใส่ใน `.env.local` ของโปรเจกต์ Next.js ที่ตัวแปร `GAS_API_URL`
9. แก้ `sendSignLink()` ในโค้ด — ตอนนี้ hardcode เป็น
   `https://your-vercel-app.vercel.app/sign/${token}` ต้องเปลี่ยนเป็นโดเมนจริงของเว็บที่ deploy แล้ว
10. ทุกครั้งที่แก้โค้ด `Code.gs` ต้อง Deploy → Manage deployments → แก้ไข (ไอคอนดินสอ) →
    เวอร์ชันใหม่ ถึงจะมีผลกับ URL `/exec` เดิม (deploy ใหม่จะได้ URL คนละอัน)

## สร้าง user แรก (owner)

ยังไม่มีฟังก์ชัน seed อัตโนมัติ — เพิ่มแถวแรกในแท็บ `users` เองก่อนใช้งาน:

| user_id | username | password_hash | role | full_name | phone | active | created_at |
|---|---|---|---|---|---|---|---|
| USR001 | owner01 | *(MD5 ของรหัสผ่านที่ต้องการ)* | owner | คุณเจ้าของ | 08xxxxxxxx | TRUE | 2026-09-08 |

หา MD5 hash ได้จากการรันใน Apps Script editor: `Logger.log(md5("รหัสผ่านที่ต้องการ"))`
(เปิดแท็บ Execution log ดูผลลัพธ์) — **ห้ามเก็บรหัสผ่านจริงในชีต เก็บแต่ hash เท่านั้น**

## ⚠️ ยังไม่ตรงกับ Next.js frontend ในโฟลเดอร์นี้

โค้ด `Code.gs` เวอร์ชันนี้ใช้ชื่อ action และรูปแบบข้อมูลที่ต่างจาก `src/lib/constants.js`
(`GAS_ACTIONS`) และ payload ที่ components ต่างๆ ส่งไปในโปรเจกต์ Next.js ที่สร้างไว้ก่อนหน้า
(เช่น `checkAvailability` แทน `getRoomAvailability`+`quotePrice`, `full_name`/`type_id`
แบบ snake_case แทน `fullName`/`roomTypeId`, ต้องเลือก `room_id` จริงก่อนสร้าง booking ไม่ใช่แค่
ประเภทห้อง ฯลฯ) — **ยังต้องปรับฝั่ง Next.js ให้เรียก action/field ตรงกับไฟล์นี้ก่อนถึงจะใช้งานร่วมกันได้**
(ยังไม่ได้ทำในรอบนี้ตามที่รอคำยืนยันจากผู้ใช้)

## หมายเหตุอื่นๆ

- **Session token**: อายุ 24 ชม. เซ็นด้วย HMAC-SHA256 + `SECRET_KEY` เก็บเป็น cookie/localStorage
  ฝั่ง client เอง ไม่มีการ revoke ก่อนหมดอายุ (ถ้าต้องการ logout แบบ invalidate ทันที ต้องเพิ่ม
  denylist หรือย้ายไปใช้ session สั้นกว่านี้)
- **Availability** เช็คจากห้องจริงในแท็บ `rooms` เทียบกับ `bookings` ที่ status เป็น
  `รอยืนยัน` / `ยืนยัน` / `check-in` เท่านั้น — ห้องที่ถูกปิดใช้งาน (`active = FALSE`) จะไม่ถูกเสนอขาย
- **อีเมล** ใช้ `GmailApp.sendEmail` (โควตาตามบัญชี Gmail/Workspace ที่รัน script)
- **รูปภาพทุกชนิด** (สลิป/กุญแจ/ลายเซ็น/decor) ถูกตั้ง sharing เป็น "Anyone with link: Viewer"
  อัตโนมัติผ่าน `uploadFileToFolder()` เพื่อให้ `<img>` ฝั่งเว็บโหลดได้ — ถ้าต้องการเป็นส่วนตัวมากกว่านี้
  ต้องเปลี่ยนไปใช้ signed URL หรือ proxy ผ่าน Apps Script แทน
