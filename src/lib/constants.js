// Central place for shared constants + the "API contract" with the Google Apps
// Script backend. Every action name + field name here is taken directly from
// the real `case` statements / destructured fields in /gas/Code.gs — this file
// used to describe an imagined API (different action names, camelCase fields,
// endpoints that don't exist) that never matched the backend. See
// PROJECT_NOTES.md for the running list of what's aligned and what's still a
// known backend gap.

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
};

// gas/Code.gs เก็บสถานะเป็น 2 ฟิลด์แยกกันในชีต bookings (ไม่ใช่ enum เดียว)
// และเก็บเป็นสตริงภาษาไทย/อังกฤษตรงๆ ตามที่ backend เขียนจริง ห้ามเปลี่ยนค่าที่นี่
// โดยไม่แก้ Code.gs คู่กัน
export const PAYMENT_STATUS = {
  PENDING_SLIP: "รอสลิป", // createBooking ตั้งค่าเริ่มต้น
  PENDING_REVIEW: "รอตรวจสลิป", // uploadSlip
  APPROVED: "ยืนยันแล้ว", // verifySlip(approved: true)
  REJECTED: "สลิปไม่ถูกต้อง", // verifySlip(approved: false)
};

export const BOOKING_STATUS = {
  PENDING: "รอยืนยัน", // createBooking ตั้งค่าเริ่มต้น
  CONFIRMED: "ยืนยัน", // verifySlip(approved: true)
  CHECKED_IN: "check-in", // checkin()
  CHECKED_OUT: "check-out", // checkout()
  CANCELLED: "ยกเลิก", // cancelBooking()
};

export const BOOKING_STATUS_LABEL = {
  [BOOKING_STATUS.PENDING]: "รอยืนยัน",
  [BOOKING_STATUS.CONFIRMED]: "ยืนยันแล้ว",
  [BOOKING_STATUS.CHECKED_IN]: "เช็คอินแล้ว",
  [BOOKING_STATUS.CHECKED_OUT]: "เช็คเอาท์แล้ว",
  [BOOKING_STATUS.CANCELLED]: "ยกเลิกแล้ว",
};

export const PAYMENT_STATUS_LABEL = {
  [PAYMENT_STATUS.PENDING_SLIP]: "รอสลิปโอนเงิน",
  [PAYMENT_STATUS.PENDING_REVIEW]: "รอตรวจสอบสลิป",
  [PAYMENT_STATUS.APPROVED]: "ยืนยันสลิปแล้ว",
  [PAYMENT_STATUS.REJECTED]: "สลิปถูกปฏิเสธ",
};

export const SIGN_DOC_TYPE = {
  CHECKIN: "checkin",
  CHECKOUT: "checkout",
};

// Names of every action the frontend can call through /api/gas.
// Kept as an object (not free strings) so a typo fails fast in dev.
// Every value below has a matching `case` in gas/Code.gs's handleRequest().
export const GAS_ACTIONS = {
  // --- Public / customer (no token) --------------------------------
  GET_RESORT_INFO: "getResortInfo",
  GET_GALLERY: "getGallery",
  GET_ROOM_TYPES: "getRoomTypes",
  // แทน getRoomAvailability + quotePrice เดิม (ไม่มีจริงใน backend) —
  // checkAvailability ตัวเดียวคืนทั้งจำนวนห้องว่าง, ห้องที่ว่าง, จำนวนคืน และราคารวม
  CHECK_AVAILABILITY: "checkAvailability",
  CREATE_BOOKING: "createBooking",
  UPLOAD_SLIP: "uploadSlip",
  GET_SIGN_LINK: "getSignLink",
  SUBMIT_SIGNATURE: "submitSignature",
  GET_BOOKING_STATUS: "getBookingStatus",

  // --- Auth ----------------------------------------------------------
  LOGIN: "login",

  // --- Owner + Admin (ต้องมี token, ทั้ง 2 role เรียกได้) --------------
  GET_BOOKINGS: "getBookings",
  GET_BOOKING_DETAIL: "getBookingDetail",
  CHECKIN: "checkin",
  CHECKOUT: "checkout",
  SEND_SIGN_LINK: "sendSignLink",
  GENERATE_PDF: "generatePDF",

  // --- Owner only ------------------------------------------------------
  VERIFY_SLIP: "verifySlip",
  CANCEL_BOOKING: "cancelBooking",
  GET_DASHBOARD: "getDashboard",
  SAVE_RESORT_INFO: "saveResortInfo",
  SAVE_ROOM_TYPE: "saveRoomType",
  SAVE_SEASONAL_PRICE: "saveSeasonalPrice",
  UPLOAD_DECOR_PHOTO: "uploadDecorPhoto",
  GET_USERS: "getUsers",
  SAVE_USER: "saveUser",
};

// ── สิ่งที่ backend (gas/Code.gs) ยังไม่รองรับ ──────────────────────────
// action พวกนี้เคยถูกอ้างถึงใน UI เดิม แต่ไม่มี case คู่กันใน Code.gs เลย
// (deleteRoomType, listSeasonalPrices, deleteSeasonalPrice, deleteAdminUser,
// deleteGalleryImage, getBookingsCalendar เป็น query แยก ฯลฯ) — หน้าที่เกี่ยวข้อง
// ปรับ UI ให้ทำได้เท่าที่ backend รองรับจริงไปก่อน (เช่น "ปิดใช้งาน" แทน "ลบ"
// โดยใช้ saveRoomType/saveUser กับ active:false, หรือตัดปุ่มลบออกเมื่อไม่มีทางทำได้
// เลยอย่างราคาเทศกาล/รูป gallery) ดู PROJECT_NOTES.md หัวข้อ "ยังไม่ได้ทำ"

export const DRIVE_FOLDER_KEYS = {
  DECOR: "decor",
  SLIP: "slip",
  UPLOAD: "upload",
  PDF: "pdf",
};

export const SESSION_STORAGE_KEY = "resort_admin_session";
