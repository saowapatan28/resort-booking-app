// Central place for shared constants + the "API contract" with the Google Apps
// Script backend. Every action name here must have a matching `case` in the
// GAS project (see /gas/Code.gs for the reference implementation).

export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  OWNER: "owner",
};

export const BOOKING_STATUS = {
  PENDING_SLIP: "pending_slip", // รอลูกค้าอัพโหลดสลิป
  PENDING_REVIEW: "pending_review", // อัพโหลดสลิปแล้ว รอ owner ตรวจ
  CONFIRMED: "confirmed", // owner ยืนยันแล้ว
  REJECTED: "rejected", // สลิปถูกปฏิเสธ
  CHECKED_IN: "checked_in",
  CHECKED_OUT: "checked_out",
  CANCELLED: "cancelled",
};

export const BOOKING_STATUS_LABEL = {
  [BOOKING_STATUS.PENDING_SLIP]: "รอสลิปโอนเงิน",
  [BOOKING_STATUS.PENDING_REVIEW]: "รอตรวจสอบสลิป",
  [BOOKING_STATUS.CONFIRMED]: "ยืนยันแล้ว",
  [BOOKING_STATUS.REJECTED]: "สลิปถูกปฏิเสธ",
  [BOOKING_STATUS.CHECKED_IN]: "เช็คอินแล้ว",
  [BOOKING_STATUS.CHECKED_OUT]: "เช็คเอาท์แล้ว",
  [BOOKING_STATUS.CANCELLED]: "ยกเลิกแล้ว",
};

export const SIGN_DOC_TYPE = {
  CHECKIN: "checkin",
  CHECKOUT: "checkout",
};

// Names of every action the frontend can call through /api/gas.
// Kept as an object (not free strings) so a typo fails fast in dev.
export const GAS_ACTIONS = {
  // --- Public / customer -----------------------------------------
  GET_RESORT_INFO: "getResortInfo",
  GET_GALLERY: "getGallery",
  GET_ROOM_TYPES: "getRoomTypes",
  GET_ROOM_AVAILABILITY: "getRoomAvailability",
  QUOTE_PRICE: "quotePrice",
  CREATE_BOOKING: "createBooking",
  UPLOAD_SLIP: "uploadSlip",
  GET_SIGN_REQUEST: "getSignRequest",
  SUBMIT_SIGNATURE: "submitSignature",
  GET_BOOKING_STATUS: "getBookingStatus",

  // --- Auth ---------------------------------------------------------
  LOGIN: "login",

  // --- Admin (check-in / check-out) ----------------------------------
  LIST_TODAY_TASKS: "listTodayTasks",
  GET_BOOKING: "getBooking",
  UPLOAD_KEY_PHOTO: "uploadKeyPhoto",
  CREATE_SIGN_LINK: "createSignLink",
  SAVE_ONSITE_SIGNATURE: "saveOnsiteSignature",
  SAVE_PROCESS_PDF: "saveProcessPdf",

  // --- Owner dashboard ------------------------------------------------
  GET_DASHBOARD_SUMMARY: "getDashboardSummary",
  GET_BOOKINGS_CALENDAR: "getBookingsCalendar",
  LIST_BOOKINGS: "listBookings",
  REVIEW_SLIP: "reviewSlip",
  CANCEL_BOOKING: "cancelBooking",

  // --- Owner: room / pricing / users / gallery management -------------
  SAVE_ROOM_TYPE: "saveRoomType",
  DELETE_ROOM_TYPE: "deleteRoomType",
  SAVE_SEASONAL_PRICE: "saveSeasonalPrice",
  LIST_SEASONAL_PRICES: "listSeasonalPrices",
  DELETE_SEASONAL_PRICE: "deleteSeasonalPrice",
  LIST_ADMIN_USERS: "listAdminUsers",
  SAVE_ADMIN_USER: "saveAdminUser",
  DELETE_ADMIN_USER: "deleteAdminUser",
  SAVE_GALLERY_IMAGE: "saveGalleryImage",
  DELETE_GALLERY_IMAGE: "deleteGalleryImage",
  SAVE_RESORT_INFO: "saveResortInfo",
};

export const DRIVE_FOLDERS = {
  GALLERY: "12wfjEanZkv3jxxOEV0UoQy3LUHNXXnnv",
  SLIPS: "1xXoSlPNIIZsExQrSDoxfp4suvkpjF4WO",
  RAW: "15pl07G1Hokar00cep5J8_dZR5JhnmLeB",
  PDF: "18Au7WyUrB7GdRQ-I5KOkV3_MdPd02Nen",
};

export const SESSION_STORAGE_KEY = "resort_admin_session";
