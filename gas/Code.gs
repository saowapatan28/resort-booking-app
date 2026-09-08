// ============================================================
//  RESORT MANAGEMENT SYSTEM — Google Apps Script Backend
//  Code.gs  |  Deploy as Web App (Execute as: Me, Anyone access)
//  Bound script — attach this to the resort_management_schema Sheet itself
//  (Extensions → Apps Script) so getActiveSpreadsheet() resolves correctly.
// ============================================================

// ── CONFIG: เปลี่ยนค่าเหล่านี้ให้ตรงกับของคุณ ──────────────
// หมายเหตุ: Drive folder ID *ไม่* ได้ hardcode ไว้ที่นี่แล้ว — อ่านจากชีต
// `drive_folders` ผ่าน getFolderId() แทน (ดูด้านล่าง) จะได้แก้ที่เดียวในชีต
// ไม่ต้องมาแก้โค้ดซ้ำทุกครั้งที่ย้าย/สร้างโฟลเดอร์ใหม่
const CONFIG = {
  ADMIN_EMAIL: "saowapa.tan28@gmail.com",   // อีเมลเจ้าของ (รับแจ้งเตือน)
  DELETE_AFTER_MONTHS: 6,          // ลบรูปดิบหลังกี่เดือน
  // ⚠️ เปลี่ยนเป็นสตริงสุ่มยาวๆ (เช่น จาก https://generate-secret.vercel.app/32)
  // ก่อน deploy จริง — ถ้าไม่เปลี่ยน ใครก็เดา/ปลอม token เป็น owner ได้
  SECRET_KEY: "REPLACE_WITH_A_LONG_RANDOM_STRING_BEFORE_DEPLOY",
};

// ── SHEET NAMES ──────────────────────────────────────────────
const SHEET = {
  DRIVE_FOLDERS:    "drive_folders",
  RESORT_INFO:      "resort_info",
  GALLERY:          "gallery",
  ROOM_TYPES:       "room_types",
  ROOMS:            "rooms",
  SEASONAL_PRICING: "seasonal_pricing",
  BOOKINGS:         "bookings",
  GUESTS:           "guests",
  CHECKIN_CHECKOUT: "checkin_checkout",
  USERS:            "users",
  SIGN_LINKS:       "sign_links",
};

// folder_key ที่ต้องมีอยู่ในชีต drive_folders (คอลัมน์ folder_key + folder_url)
const FOLDER_KEY = { DECOR: "decor", SLIP: "slip", UPLOAD: "upload", PDF: "pdf" };

// สถานะที่ถือว่า "ห้องไม่ว่าง" ในการเช็ค availability
// (ต้องรวม check-in ด้วย ไม่งั้นห้องที่แขกพักอยู่จะโดนจองซ้ำได้)
const ACTIVE_BOOKING_STATUSES = ["รอยืนยัน", "ยืนยัน", "check-in"];

// ============================================================
//  ENTRY POINTS
// ============================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const params = e.parameter || {};
    const postData = e.postData ? JSON.parse(e.postData.contents || "{}") : {};
    const data = Object.assign({}, params, postData);
    const action = data.action || "";

    // ── Auth check (ยกเว้น public routes) ──
    const PUBLIC_ACTIONS = [
      "getResortInfo", "getRoomTypes", "getGallery",
      "checkAvailability", "createBooking", "uploadSlip",
      "getSignLink", "submitSignature", "login", "getBookingStatus",
    ];
    if (!PUBLIC_ACTIONS.includes(action)) {
      const authResult = verifyToken(data.token);
      if (!authResult.ok) return jsonResponse({ ok: false, error: "Unauthorized" });
      data._user = authResult.user;
    }

    // ── Route ──
    switch (action) {

      // ── PUBLIC ──────────────────────────────────────
      case "getResortInfo":       return jsonResponse(getResortInfo());
      case "getRoomTypes":        return jsonResponse(getRoomTypes());
      case "getGallery":          return jsonResponse(getGallery());
      case "checkAvailability":   return jsonResponse(checkAvailability(data));
      case "createBooking":       return jsonResponse(createBooking(data));
      case "uploadSlip":          return jsonResponse(uploadSlip(data));
      case "getSignLink":         return jsonResponse(getSignLink(data));
      case "submitSignature":     return jsonResponse(submitSignature(data));
      case "login":                return jsonResponse(login(data));
      // [เพิ่มใหม่] ลูกค้าเช็คสถานะจองของตัวเองด้วย booking_id เฉยๆ ได้ ไม่ต้อง login
      // (คืนเฉพาะข้อมูลจอง ไม่มี PII ของแขกคนอื่น)
      case "getBookingStatus":    return jsonResponse(getBookingStatusPublic(data));

      // ── OWNER + ADMIN ────────────────────────────────
      case "getBookings":         return jsonResponse(getBookings(data));
      case "getBookingDetail":    return jsonResponse(getBookingDetail(data));
      case "checkin":              return jsonResponse(checkin(data));
      case "checkout":             return jsonResponse(checkout(data));
      case "sendSignLink":        return jsonResponse(sendSignLink(data));
      case "generatePDF":         return jsonResponse(generatePDF(data));

      // ── OWNER ONLY ───────────────────────────────────
      // [แก้] verifySlip / confirmBooking / cancelBooking ย้ายมาโซนนี้ —
      // ของเดิมไม่ได้ผ่าน requireRole ทำให้ admin ธรรมดาก็ยืนยัน/ยกเลิก+คืนเงินได้
      case "verifySlip":          return jsonResponse(requireRole(data, "owner", () => verifySlip(data)));
      case "confirmBooking":      return jsonResponse(requireRole(data, "owner", () => confirmBooking(data)));
      case "cancelBooking":       return jsonResponse(requireRole(data, "owner", () => cancelBooking(data)));
      case "getDashboard":        return jsonResponse(requireRole(data, "owner", getDashboard));
      case "saveResortInfo":      return jsonResponse(requireRole(data, "owner", () => saveResortInfo(data)));
      case "saveRoomType":        return jsonResponse(requireRole(data, "owner", () => saveRoomType(data)));
      case "saveSeasonalPrice":   return jsonResponse(requireRole(data, "owner", () => saveSeasonalPrice(data)));
      case "uploadDecorPhoto":    return jsonResponse(requireRole(data, "owner", () => uploadDecorPhoto(data)));
      case "getUsers":            return jsonResponse(requireRole(data, "owner", getUsers));
      case "saveUser":            return jsonResponse(requireRole(data, "owner", () => saveUser(data)));

      default:
        return jsonResponse({ ok: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

// ============================================================
//  AUTH
// ============================================================

function login(data) {
  const { username, password } = data;
  if (!username || !password) return { ok: false, error: "กรุณากรอก username และ password" };

  const ws = getSheet(SHEET.USERS);
  const rows = ws.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const [user_id, uname, pwd_hash, role, full_name, phone, active] = rows[i];
    if (uname === username && pwd_hash === md5(password) && isTrue(active)) {
      const token = generateToken(user_id, role);
      return { ok: true, token, role, full_name, user_id };
    }
  }
  return { ok: false, error: "username หรือ password ไม่ถูกต้อง" };
}

// [แก้] token เดิมเป็นแค่ base64(payload) ไม่มี signature ใครก็ปลอมเป็น owner ได้
// ตอนนี้เซ็นด้วย HMAC-SHA256 + CONFIG.SECRET_KEY แล้วค่อย verify signature ก่อนเชื่อ payload
function generateToken(user_id, role) {
  const payload = `${user_id}|${role}|${Date.now()}`;
  const sig = Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(payload, CONFIG.SECRET_KEY)
  );
  return Utilities.base64EncodeWebSafe(payload) + "." + sig;
}

function verifyToken(token) {
  try {
    if (!token || token.indexOf(".") < 0) return { ok: false };
    const [encodedPayload, sig] = token.split(".");
    const payload = Utilities.newBlob(
      Utilities.base64DecodeWebSafe(encodedPayload)
    ).getDataAsString();
    const expectedSig = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(payload, CONFIG.SECRET_KEY)
    );
    if (sig !== expectedSig) return { ok: false, error: "Invalid token" };

    const [user_id, role, ts] = payload.split("|");
    const age = (Date.now() - parseInt(ts, 10)) / 1000 / 60 / 60;
    if (age > 24) return { ok: false, error: "Token หมดอายุ" };
    return { ok: true, user: { user_id, role } };
  } catch (e) {
    return { ok: false };
  }
}

function requireRole(data, requiredRole, fn) {
  const user = data._user;
  if (!user) return { ok: false, error: "Unauthorized" };
  if (requiredRole === "owner" && user.role !== "owner") {
    return { ok: false, error: "เฉพาะเจ้าของเท่านั้น" };
  }
  return fn();
}

// ============================================================
//  PUBLIC — Resort Info / Rooms / Gallery
// ============================================================

function getResortInfo() {
  const ws = getSheet(SHEET.RESORT_INFO);
  const rows = ws.getDataRange().getValues();
  const info = {};
  rows.forEach(([field, value]) => { if (field) info[field] = value; });
  return { ok: true, data: info };
}

function saveResortInfo(data) {
  const ws = getSheet(SHEET.RESORT_INFO);
  const rows = ws.getDataRange().getValues();
  const updates = data.fields || {};   // { resort_name: "xxx", phone: "yyy", ... }
  rows.forEach((row, i) => {
    const field = row[0];
    if (field && updates.hasOwnProperty(field)) {
      ws.getRange(i + 1, 2).setValue(updates[field]);
    }
  });
  return { ok: true, message: "บันทึกข้อมูลรีสอร์ทแล้ว" };
}

function getRoomTypes() {
  const ws = getSheet(SHEET.ROOM_TYPES);
  const [headers, ...rows] = ws.getDataRange().getValues();
  const data = rows
    .filter(r => isTrue(r[9]))
    .map(r => rowToObj(headers, r));
  return { ok: true, data };
}

function getGallery() {
  const ws = getSheet(SHEET.GALLERY);
  const [headers, ...rows] = ws.getDataRange().getValues();
  const data = rows
    .filter(r => r[0])
    .map(r => rowToObj(headers, r))
    .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  return { ok: true, data };
}

// ============================================================
//  AVAILABILITY & BOOKING
// ============================================================

function checkAvailability(data) {
  const { type_id, check_in, check_out } = data;
  if (!check_in || !check_out) return { ok: false, error: "กรุณาระบุวันที่" };

  const checkInDate  = new Date(check_in);
  const checkOutDate = new Date(check_out);
  if (checkOutDate <= checkInDate) return { ok: false, error: "วันออกต้องหลังวันเข้า" };

  const bookedRooms = getBookedRooms(check_in, check_out);

  // หา rooms ที่ว่าง
  const wsRooms = getSheet(SHEET.ROOMS);
  const [rh, ...roomRows] = wsRooms.getDataRange().getValues();
  const allRooms = roomRows
    .filter(r => isTrue(r[5]))
    .map(r => rowToObj(rh, r));

  const available = allRooms.filter(r =>
    !bookedRooms.includes(r.room_id) &&
    (!type_id || r.type_id === type_id)
  );

  const nights = Math.ceil((checkOutDate - checkInDate) / 86400000);
  // [แก้] ถ้าไม่ได้ระบุ type_id (เบราส์ทุกประเภทพร้อมกัน) อย่าคำนวณราคาจากห้องแรกที่เจอ
  // แบบสุ่มๆ — คืน null ไปดีกว่า ให้ frontend เรียกซ้ำพร้อม type_id ตอนจะดูราคาจริง
  const price = type_id ? calculatePrice(type_id, checkInDate, checkOutDate) : null;

  return { ok: true, available_count: available.length, nights, price, rooms: available };
}

function getBookedRooms(check_in, check_out) {
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const booked = [];
  const newIn  = new Date(check_in);
  const newOut = new Date(check_out);

  rows.forEach(row => {
    const obj = rowToObj(h, row);
    // [แก้] ต้องนับ "check-in" เป็นสถานะไม่ว่างด้วย ไม่งั้นห้องที่แขกพักอยู่จริง
    // จะโดนจองซ้ำได้ในช่วงวันเดียวกัน
    if (!ACTIVE_BOOKING_STATUSES.includes(obj.booking_status)) return;
    const existIn  = new Date(normDate(obj.check_in_date));
    const existOut = new Date(normDate(obj.check_out_date));
    if (newIn < existOut && newOut > existIn) {
      booked.push(obj.room_id);
    }
  });
  return booked;
}

function calculatePrice(type_id, checkIn, checkOut) {
  if (!type_id) return 0;

  // ดึงราคาปกติ
  const wsTypes = getSheet(SHEET.ROOM_TYPES);
  const [th, ...typeRows] = wsTypes.getDataRange().getValues();
  const typeObj = typeRows.map(r => rowToObj(th, r)).find(r => r.type_id === type_id);
  if (!typeObj) return 0;

  // ดึง seasonal pricing
  const wsSeason = getSheet(SHEET.SEASONAL_PRICING);
  const [sh, ...seasonRows] = wsSeason.getDataRange().getValues();
  const seasons = seasonRows.map(r => rowToObj(sh, r)).filter(r => r.type_id === type_id);

  let total = 0;
  let d = new Date(checkIn);
  while (d < checkOut) {
    const dateStr = formatDate(d);
    const season = seasons.find(s => dateStr >= normDate(s.date_from) && dateStr <= normDate(s.date_to));
    if (season) {
      total += parseFloat(season.price) || 0;
    } else {
      const dow = d.getDay(); // 0=Sun, 6=Sat
      const isWeekend = dow === 0 || dow === 6;
      total += isWeekend
        ? (parseFloat(typeObj.price_weekend) || 0)
        : (parseFloat(typeObj.price_weekday) || 0);
    }
    d.setDate(d.getDate() + 1);
  }
  return total;
}

function createBooking(data) {
  const { guest, room_id, type_id, check_in, check_out } = data;
  if (!guest?.full_name || !guest?.phone || !room_id || !check_in || !check_out) {
    return { ok: false, error: "ข้อมูลไม่ครบ" };
  }

  // ตรวจสอบห้องว่างอีกครั้ง
  const avail = checkAvailability({ type_id, check_in, check_out });
  const roomAvail = avail.rooms?.find(r => r.room_id === room_id);
  if (!roomAvail) return { ok: false, error: "ห้องนี้ไม่ว่างในช่วงเวลาที่เลือก" };

  // บันทึก Guest
  const guest_id = saveGuest(guest);

  // สร้าง Booking
  const booking_id = generateId("BK");
  const nights = Math.ceil((new Date(check_out) - new Date(check_in)) / 86400000);
  const total  = calculatePrice(type_id, new Date(check_in), new Date(check_out));

  const ws = getSheet(SHEET.BOOKINGS);
  ws.appendRow([
    booking_id, formatDate(new Date()), guest_id, room_id, type_id,
    check_in, check_out, nights, total,
    "", "", "รอสลิป",
    "รอยืนยัน", "", "", ""
  ]);

  // ส่ง Email ลูกค้า
  if (guest.email) sendBookingEmail(guest.email, booking_id, guest.full_name, room_id, check_in, check_out, total);

  return { ok: true, booking_id, total, message: "จองสำเร็จ กรุณาอัพโหลดสลิปการโอนเงิน" };
}

function saveGuest(guest) {
  const ws = getSheet(SHEET.GUESTS);
  const [h, ...rows] = ws.getDataRange().getValues();
  // เช็คว่ามีอยู่แล้วไหม (ใช้เบอร์โทร)
  const existing = rows.find(r => r[2] === guest.phone);
  if (existing) return existing[0];

  const guest_id = generateId("GST");
  ws.appendRow([
    guest_id, guest.full_name, guest.phone,
    guest.email || "", guest.id_card || "",
    guest.note || "", formatDate(new Date())
  ]);
  return guest_id;
}

// [เพิ่มใหม่] ให้ลูกค้าเช็คสถานะจองของตัวเองด้วย booking_id เฉยๆ (public, ไม่ต้อง login)
// คืนเฉพาะข้อมูลจอง ไม่รวมเบอร์โทร/อีเมล/เลขบัตรของแขกคนอื่น
function getBookingStatusPublic(data) {
  const { booking_id } = data;
  if (!booking_id) return { ok: false, error: "กรุณาระบุ booking_id" };
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const row = rows.find(r => r[0] === booking_id);
  if (!row) return { ok: false, error: "ไม่พบการจองนี้" };
  const b = rowToObj(h, row);
  return {
    ok: true,
    data: {
      booking_id: b.booking_id,
      room_id: b.room_id,
      type_id: b.type_id,
      check_in_date: b.check_in_date,
      check_out_date: b.check_out_date,
      nights: b.nights,
      total_price: b.total_price,
      payment_status: b.payment_status,
      booking_status: b.booking_status,
    },
  };
}

// ============================================================
//  SLIP UPLOAD
// ============================================================

function uploadSlip(data) {
  const { booking_id, file_base64, mime_type } = data;
  if (!booking_id || !file_base64) return { ok: false, error: "ข้อมูลไม่ครบ" };

  const uploaded = uploadFileToFolder(
    getFolderId(FOLDER_KEY.SLIP), file_base64, mime_type || "image/jpeg",
    `${booking_id}_slip_${Date.now()}.jpg`
  );
  const now = formatDate(new Date());

  updateBookingField(booking_id, "slip_url", uploaded.url);
  updateBookingField(booking_id, "slip_uploaded_at", now);
  updateBookingField(booking_id, "payment_status", "รอตรวจสลิป");

  notifyOwner(`มีสลิปใหม่จากการจอง ${booking_id} กรุณาตรวจสอบ`, uploaded.url);

  return { ok: true, slip_url: uploaded.url, message: "อัพโหลดสลิปสำเร็จ รอเจ้าของตรวจสอบ" };
}

// ============================================================
//  BOOKING MANAGEMENT (Owner)
// ============================================================

function getBookings(data) {
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  let bookings = rows
    .filter(r => r[0])
    .map(r => rowToObj(h, r));

  // filter
  if (data.status)    bookings = bookings.filter(b => b.booking_status === data.status);
  if (data.date_from) bookings = bookings.filter(b => normDate(b.check_in_date) >= data.date_from);
  if (data.date_to)   bookings = bookings.filter(b => normDate(b.check_in_date) <= data.date_to);

  return { ok: true, data: bookings, count: bookings.length };
}

function getBookingDetail(data) {
  const { booking_id } = data;
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const row = rows.find(r => r[0] === booking_id);
  if (!row) return { ok: false, error: "ไม่พบการจอง" };

  const booking = rowToObj(h, row);

  // ดึงข้อมูล guest
  const guest = getGuestById(booking.guest_id);
  return { ok: true, data: { ...booking, guest } };
}

function verifySlip(data) {
  const { booking_id, approved } = data;
  updateBookingField(booking_id, "payment_status", approved ? "ยืนยันแล้ว" : "สลิปไม่ถูกต้อง");
  if (approved) {
    updateBookingField(booking_id, "booking_status", "ยืนยัน");
    // แจ้ง email ลูกค้า
    const detail = getBookingDetail({ booking_id });
    if (detail.ok && detail.data.guest?.email) {
      sendConfirmEmail(detail.data.guest.email, booking_id, detail.data);
    }
  }
  return { ok: true, message: approved ? "ยืนยันการจองแล้ว" : "ปฏิเสธสลิป" };
}

function confirmBooking(data) {
  return verifySlip({ ...data, approved: true });
}

function cancelBooking(data) {
  const { booking_id, refund_pct } = data;
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const rowIdx = rows.findIndex(r => r[0] === booking_id);
  if (rowIdx < 0) return { ok: false, error: "ไม่พบการจอง" };

  const booking = rowToObj(h, rows[rowIdx]);
  const refund_amount = Math.round((parseFloat(refund_pct) / 100) * parseFloat(booking.total_price));

  updateBookingField(booking_id, "booking_status", "ยกเลิก");
  updateBookingField(booking_id, "cancel_refund_pct", refund_pct || 0);
  updateBookingField(booking_id, "cancel_refund_amount", refund_amount);

  return { ok: true, refund_amount, message: `ยกเลิกแล้ว คืนเงิน ${refund_pct}% = ${refund_amount} บาท` };
}

// ============================================================
//  CHECK-IN / CHECK-OUT
// ============================================================

function checkin(data) {
  const { booking_id, key_photo_base64, admin_user_id, gps, ip } = data;
  if (!booking_id || !key_photo_base64) return { ok: false, error: "ข้อมูลไม่ครบ" };

  const uploaded = uploadFileToFolder(
    getFolderId(FOLDER_KEY.UPLOAD), key_photo_base64, "image/jpeg",
    `key_${booking_id}_${Date.now()}.jpg`
  );

  const record_id = generateId("CI");
  const detail    = getBookingDetail({ booking_id });
  if (!detail.ok) return { ok: false, error: "ไม่พบการจอง" };
  const b = detail.data;

  const ws = getSheet(SHEET.CHECKIN_CHECKOUT);
  ws.appendRow([
    record_id, booking_id, b.room_id, b.guest_id,
    formatDateTime(new Date()), admin_user_id, uploaded.url,
    "", gps || "", ip || "", "",  // signature + pdf ยังว่าง
    "", "", "", "", "", "",        // checkout ยังว่าง
    formatDate(new Date())
  ]);

  updateBookingField(booking_id, "booking_status", "check-in");
  return { ok: true, record_id, key_url: uploaded.url, message: "บันทึก check-in แล้ว" };
}

function checkout(data) {
  const { booking_id, admin_user_id, gps, ip } = data;

  updateCheckinField(booking_id, "checkout_at", formatDateTime(new Date()));
  updateCheckinField(booking_id, "checkout_by", admin_user_id || "");
  updateCheckinField(booking_id, "checkout_gps", gps || "");
  updateCheckinField(booking_id, "checkout_ip", ip || "");
  updateBookingField(booking_id, "booking_status", "check-out");

  return { ok: true, message: "บันทึก check-out แล้ว รอลายเซ็น" };
}

// ============================================================
//  SIGNATURE & SIGN LINK
// ============================================================

function sendSignLink(data) {
  const { booking_id, type, send_to, send_via } = data;
  // type = "checkin" | "checkout"

  const token   = generateId("SGN") + generateId("TKN");
  const link_id = generateId("LNK");
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);

  const ws = getSheet(SHEET.SIGN_LINKS);
  ws.appendRow([
    link_id, booking_id, token, type,
    send_to, send_via || "LINE",
    formatDateTime(expires), "", "pending"
  ]);

  // TODO: ส่ง LINE Notify หรือ SMS จริง
  // ตัวอย่าง URL: https://your-vercel-app.vercel.app/sign/[token]
  const sign_url = `https://your-vercel-app.vercel.app/sign/${token}`;

  // ส่ง Email แทนก่อน (ถ้ามี email)
  const detail = getBookingDetail({ booking_id });
  if (detail.ok && detail.data.guest?.email) {
    GmailApp.sendEmail(
      detail.data.guest.email,
      `[รีสอร์ท] กรุณาเซ็นเอกสาร${type === "checkin" ? "รับ" : "คืน"}กุญแจ`,
      `กรุณาคลิกลิงก์เพื่อเซ็นเอกสาร:\n${sign_url}\n\nลิงก์หมดอายุใน 24 ชั่วโมง`
    );
  }

  return { ok: true, link_id, sign_url, expires: formatDateTime(expires) };
}

function getSignLink(data) {
  const { token } = data;
  const ws = getSheet(SHEET.SIGN_LINKS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const row = rows.find(r => r[2] === token);
  if (!row) return { ok: false, error: "ลิงก์ไม่ถูกต้อง" };

  const link = rowToObj(h, row);
  if (link.status === "signed") return { ok: false, error: "เซ็นไปแล้ว" };
  if (new Date() > new Date(link.expires_at)) return { ok: false, error: "ลิงก์หมดอายุ" };

  // ดึงข้อมูลการจองพร้อม
  const detail = getBookingDetail({ booking_id: link.booking_id });
  return { ok: true, link, booking: detail.data };
}

function submitSignature(data) {
  const { token, signature_base64, gps, ip } = data;
  if (!token || !signature_base64) return { ok: false, error: "ข้อมูลไม่ครบ" };

  // ดึง link
  const linkResult = getSignLink({ token });
  if (!linkResult.ok) return linkResult;
  const link = linkResult.link;

  const uploaded = uploadFileToFolder(
    getFolderId(FOLDER_KEY.UPLOAD), signature_base64, "image/png",
    `sign_${link.type}_${link.booking_id}_${Date.now()}.png`
  );

  // บันทึกลายเซ็นใน checkin_checkout
  if (link.type === "checkin") {
    updateCheckinField(link.booking_id, "checkin_signature_url", uploaded.url);
    updateCheckinField(link.booking_id, "checkin_gps", gps || "");
    updateCheckinField(link.booking_id, "checkin_ip", ip || "");
  } else {
    updateCheckinField(link.booking_id, "checkout_signature_url", uploaded.url);
    updateCheckinField(link.booking_id, "checkout_gps", gps || "");
    updateCheckinField(link.booking_id, "checkout_ip", ip || "");
  }

  // Mark link ว่า signed
  updateSignLinkField(token, "signed_at", formatDateTime(new Date()));
  updateSignLinkField(token, "status", "signed");

  return { ok: true, sig_url: uploaded.url, message: "เซ็นเอกสารสำเร็จ" };
}

// ============================================================
//  ROOM MANAGEMENT (Owner)
// ============================================================

function saveRoomType(data) {
  const ws = getSheet(SHEET.ROOM_TYPES);
  const [h, ...rows] = ws.getDataRange().getValues();
  const existing = rows.findIndex(r => r[0] === data.type_id);

  const rowData = [
    data.type_id || generateId("RT"),
    data.type_name, data.description, data.max_guests,
    data.price_weekday, data.price_weekend, data.total_rooms,
    data.amenities, data.photo_urls, data.active || "TRUE"
  ];

  if (existing >= 0) {
    ws.getRange(existing + 2, 1, 1, rowData.length).setValues([rowData]);
    return { ok: true, message: "อัพเดทประเภทห้องแล้ว" };
  } else {
    ws.appendRow(rowData);
    return { ok: true, type_id: rowData[0], message: "เพิ่มประเภทห้องแล้ว" };
  }
}

function saveSeasonalPrice(data) {
  const ws = getSheet(SHEET.SEASONAL_PRICING);
  const rowData = [
    data.price_id || generateId("SP"),
    data.season_name, data.date_from, data.date_to,
    data.type_id, data.price, data.note || ""
  ];
  ws.appendRow(rowData);
  return { ok: true, price_id: rowData[0], message: "บันทึกราคาเทศกาลแล้ว" };
}

function uploadDecorPhoto(data) {
  const { file_base64, file_name, caption, sort_order, mime_type } = data;
  const uploaded = uploadFileToFolder(
    getFolderId(FOLDER_KEY.DECOR), file_base64, mime_type || "image/jpeg",
    file_name || `decor_${Date.now()}.jpg`
  );

  // บันทึกใน gallery sheet
  const ws = getSheet(SHEET.GALLERY);
  ws.appendRow([
    generateId("GAL"), uploaded.url, caption || "",
    sort_order || 99, formatDate(new Date())
  ]);

  return { ok: true, url: uploaded.url, message: "อัพโหลดรูปสำเร็จ" };
}

// ============================================================
//  DASHBOARD (Owner)
// ============================================================

function getDashboard() {
  const ws = getSheet(SHEET.BOOKINGS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const bookings = rows.filter(r => r[0]).map(r => rowToObj(h, r));

  const today = formatDate(new Date());
  const thisMonth = today.substring(0, 7);

  const summary = {
    total_bookings:   bookings.length,
    pending:          bookings.filter(b => b.booking_status === "รอยืนยัน").length,
    confirmed:        bookings.filter(b => b.booking_status === "ยืนยัน").length,
    checkin_today:    bookings.filter(b => normDate(b.check_in_date) === today).length,
    checkout_today:   bookings.filter(b => normDate(b.check_out_date) === today).length,
    revenue_today:    bookings
      .filter(b => normDate(b.created_at) === today && b.booking_status !== "ยกเลิก")
      .reduce((s, b) => s + (parseFloat(b.total_price) || 0), 0),
    revenue_month:    bookings
      .filter(b => normDate(b.created_at).startsWith(thisMonth) && b.booking_status !== "ยกเลิก")
      .reduce((s, b) => s + (parseFloat(b.total_price) || 0), 0),
  };

  // Occupancy ปัจจุบัน
  const occupied = bookings.filter(b =>
    b.booking_status === "check-in" ||
    (b.booking_status === "ยืนยัน" && normDate(b.check_in_date) <= today && normDate(b.check_out_date) > today)
  ).length;

  // [แก้] นับเฉพาะห้องที่ active เท่านั้น ของเดิมนับทุกแถวรวมห้องที่ปิดใช้งานด้วย
  const wsRooms = getSheet(SHEET.ROOMS);
  const [, ...roomRows] = wsRooms.getDataRange().getValues();
  const total_rooms = roomRows.filter(r => isTrue(r[5])).length;
  summary.occupancy_rate = total_rooms > 0 ? Math.round((occupied / total_rooms) * 100) : 0;

  return { ok: true, data: summary };
}

// ============================================================
//  USER MANAGEMENT (Owner)
// ============================================================

function getUsers() {
  const ws = getSheet(SHEET.USERS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const users = rows.filter(r => r[0]).map(r => {
    const obj = rowToObj(h, r);
    delete obj.password_hash;  // ไม่ส่ง hash กลับ
    return obj;
  });
  return { ok: true, data: users };
}

function saveUser(data) {
  const ws = getSheet(SHEET.USERS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const existing = rows.findIndex(r => r[0] === data.user_id);

  const user_id = data.user_id || generateId("USR");

  // [แก้] เดิมถ้าสร้าง user ใหม่ (existing = -1) โดยไม่ใส่ password จะได้ pwd_hash = ""
  // ทำให้ user นั้น login ไม่ได้เลยแบบเงียบๆ — ตอนนี้บังคับต้องใส่ password ตอนสร้างใหม่
  let pwd_hash;
  if (data.password) {
    pwd_hash = md5(data.password);
  } else if (existing >= 0) {
    pwd_hash = rows[existing][2]; // แก้ไข user เดิมโดยไม่เปลี่ยนรหัสผ่าน
  } else {
    return { ok: false, error: "กรุณาระบุรหัสผ่านสำหรับผู้ใช้ใหม่" };
  }

  const rowData = [
    user_id, data.username, pwd_hash,
    data.role, data.full_name, data.phone,
    data.active || "TRUE", formatDate(new Date())
  ];

  if (existing >= 0) {
    ws.getRange(existing + 2, 1, 1, rowData.length).setValues([rowData]);
    return { ok: true, message: "อัพเดท user แล้ว" };
  } else {
    ws.appendRow(rowData);
    return { ok: true, user_id, message: "เพิ่ม user แล้ว" };
  }
}

// ============================================================
//  PDF (placeholder — สร้าง PDF จริงฝั่ง Next.js ดีกว่า)
// ============================================================

function generatePDF(data) {
  // PDF จริงสร้างฝั่ง Next.js (jsPDF) แล้วส่ง base64 มา save ที่นี่
  const { booking_id, type, pdf_base64 } = data;
  if (!pdf_base64) {
    return { ok: false, error: "ส่ง PDF base64 มาด้วย (สร้างจาก Next.js)" };
  }

  const uploaded = uploadFileToFolder(
    getFolderId(FOLDER_KEY.PDF), pdf_base64, "application/pdf",
    `${type}_${booking_id}_${formatDate(new Date())}.pdf`
  );

  const field = type === "checkin" ? "checkin_pdf_url" : "checkout_pdf_url";
  updateCheckinField(booking_id, field, uploaded.url);

  return { ok: true, pdf_url: uploaded.url, message: "บันทึก PDF แล้ว" };
}

// ============================================================
//  AUTO-DELETE รูปดิบ > 6 เดือน (Time Trigger ทุกอาทิตย์)
// ============================================================

function deleteOldTempFiles() {
  const folder  = DriveApp.getFolderById(getFolderId(FOLDER_KEY.UPLOAD));
  const cutoff  = new Date();
  cutoff.setMonth(cutoff.getMonth() - CONFIG.DELETE_AFTER_MONTHS);

  const files   = folder.getFiles();
  let deleted   = 0;
  while (files.hasNext()) {
    const file = files.next();
    if (file.getDateCreated() < cutoff) {
      file.setTrashed(true);
      deleted++;
    }
  }
  console.log(`Auto-delete: ลบ ${deleted} ไฟล์ที่อายุ > ${CONFIG.DELETE_AFTER_MONTHS} เดือน`);
}

// ── ตั้ง Time Trigger (รันครั้งเดียวตอน setup) ──────────────
function setupTriggers() {
  // ลบ trigger เก่าก่อน
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  // รันทุกวันอาทิตย์ ตี 2
  ScriptApp.newTrigger("deleteOldTempFiles")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(2)
    .create();
  console.log("✅ ตั้ง trigger auto-delete เรียบร้อย");
}

// ============================================================
//  EMAIL HELPERS
// ============================================================

function sendBookingEmail(email, booking_id, name, room_id, check_in, check_out, total) {
  const subject = `[ยืนยันการจอง] ${booking_id}`;
  const body = `
เรียน คุณ${name}

ขอบคุณที่จองห้องพักกับเรา 🙏
รหัสการจอง: ${booking_id}
ห้อง: ${room_id}
วันเข้าพัก: ${check_in}
วันออก: ${check_out}
ยอดรวม: ${total.toLocaleString()} บาท

กรุณาโอนเงินและอัพโหลดสลิปที่เว็บไซต์
เจ้าหน้าที่จะยืนยันการจองหลังตรวจสอบสลิปแล้ว

ขอบคุณครับ/ค่ะ`;
  GmailApp.sendEmail(email, subject, body);
}

function sendConfirmEmail(email, booking_id, booking) {
  GmailApp.sendEmail(
    email,
    `[ยืนยันแล้ว] การจอง ${booking_id}`,
    `การจองของคุณได้รับการยืนยันแล้ว 🎉\nรหัสการจอง: ${booking_id}\nพบกันวันที่ ${booking.check_in_date} ครับ/ค่ะ`
  );
}

function notifyOwner(message, url) {
  GmailApp.sendEmail(CONFIG.ADMIN_EMAIL, "[Resort] แจ้งเตือน", `${message}\n${url || ""}`);
}

// ============================================================
//  UTILITIES
// ============================================================

function getSheet(name) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
}

function rowToObj(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { if (h) obj[h] = row[i] ?? ""; });
  return obj;
}

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();
}

function formatDate(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd");
}

function formatDateTime(d) {
  return Utilities.formatDate(d, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
}

// [เพิ่มใหม่] true ไม่ว่าคอลัมน์ active จะเป็นข้อความ "TRUE"/"true" หรือ checkbox (boolean จริง)
// ของเดิมเทียบ === "TRUE" ตรงๆ เลยพลาดถ้า cell เป็น checkbox
function isTrue(v) {
  return String(v).trim().toUpperCase() === "TRUE";
}

// [เพิ่มใหม่] ทำให้ค่าจากคอลัมน์วันที่เป็น "yyyy-MM-dd" เสมอ ไม่ว่า Google Sheets
// จะเก็บ cell นั้นเป็น Date object (auto-detect) หรือข้อความธรรมดา — กันบั๊กเทียบวันที่ผิด
function normDate(v) {
  if (v instanceof Date) return formatDate(v);
  return String(v).slice(0, 10);
}

function md5(str) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, str)
    .map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0"))
    .join("");
}

// [เพิ่มใหม่] อ่าน Drive folder ID จากชีต drive_folders (คอลัมน์ folder_key, folder_url)
// แทนการ hardcode ไว้ในโค้ด — แก้ที่ชีตที่เดียวพอ ไม่ต้องมาแก้ CONFIG ในโค้ดซ้ำอีกที่
// จำผลไว้ใน memory ระหว่าง request เดียวกัน กันอ่านชีตซ้ำหลายรอบโดยไม่จำเป็น
const _folderIdCache = {};
function getFolderId(key) {
  if (_folderIdCache[key]) return _folderIdCache[key];

  const ws = getSheet(SHEET.DRIVE_FOLDERS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const colKey = h.indexOf("folder_key");
  const colUrl = h.indexOf("folder_url");
  const row = rows.find(r => r[colKey] === key);
  if (!row) throw new Error(`ไม่พบ folder_key "${key}" ในชีต drive_folders`);

  const url = String(row[colUrl] || "");
  const match = /folders\/([a-zA-Z0-9_-]+)/.exec(url);
  if (!match) throw new Error(`folder_url ของ "${key}" ในชีต drive_folders รูปแบบไม่ถูกต้อง: ${url}`);

  _folderIdCache[key] = match[1];
  return _folderIdCache[key];
}

// [เพิ่มใหม่] จุดเดียวสำหรับอัพโหลดไฟล์ทุกชนิด (สลิป/กุญแจ/ลายเซ็น/decor/PDF):
// - เดิม slip/key/signature ใช้ file.getUrl() ซึ่งเป็นลิงก์หน้า Drive viewer
//   ไม่ใช่ direct image URL ทำให้ <img src> ในเว็บโชว์ไม่ขึ้น (มีแค่ decor ที่ใช้ uc?id= ถูกแล้ว)
// - เดิมมีแค่ decor ที่ setSharing ให้ ไฟล์อื่นจะดูได้เฉพาะถ้า folder แม่ share ไว้แล้วเท่านั้น
// รวมเป็นฟังก์ชันเดียว ให้ทุกไฟล์ได้ URL ที่ใช้แสดงผลได้จริงและสิทธิ์ดูที่ถูกต้องเหมือนกันหมด
function uploadFileToFolder(folderId, base64, mimeType, fileName) {
  const folder = DriveApp.getFolderById(folderId);
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { fileId: file.getId(), url: `https://drive.google.com/uc?id=${file.getId()}` };
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getGuestById(guest_id) {
  const ws = getSheet(SHEET.GUESTS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const row = rows.find(r => r[0] === guest_id);
  return row ? rowToObj(h, row) : null;
}

function updateBookingField(booking_id, field, value) {
  updateSheetField(SHEET.BOOKINGS, booking_id, field, value);
}

// [แก้] เดิมฟังก์ชันนี้เรียก updateSheetField(SHEET.CHECKIN_CHECKOUT, booking_id, ...)
// ซึ่งค้นหาแถวด้วยคอลัมน์ A (record_id) — แต่ผู้เรียกส่ง booking_id มา ทำให้หาแถวไม่เจอ
// ตลอดเวลา (checkout/submitSignature/generatePDF จึง "สำเร็จ" แต่ไม่ได้บันทึกอะไรจริง)
// ตอนนี้ค้นหาด้วยคอลัมน์ B (booking_id, index 1) โดยตรงแทน
function updateCheckinField(booking_id, field, value) {
  const ws = getSheet(SHEET.CHECKIN_CHECKOUT);
  const [h, ...rows] = ws.getDataRange().getValues();
  const colIdx = h.indexOf(field);
  if (colIdx < 0) return;
  const rowIdx = rows.findIndex(r => r[1] === booking_id); // คอลัมน์ B = booking_id
  if (rowIdx >= 0) ws.getRange(rowIdx + 2, colIdx + 1).setValue(value);
}

function updateSignLinkField(token, field, value) {
  const ws = getSheet(SHEET.SIGN_LINKS);
  const [h, ...rows] = ws.getDataRange().getValues();
  const colIdx = h.indexOf(field);
  if (colIdx < 0) return;
  // sign_links ใช้ token (col 3, index 2) เป็น key
  const rowIdx = rows.findIndex(r => r[2] === token);
  if (rowIdx >= 0) ws.getRange(rowIdx + 2, colIdx + 1).setValue(value);
}

function updateSheetField(sheetName, id, field, value) {
  const ws = getSheet(sheetName);
  const [h, ...rows] = ws.getDataRange().getValues();
  const colIdx = h.indexOf(field);
  if (colIdx < 0) return;
  const rowIdx = rows.findIndex(r => r[0] === id);
  if (rowIdx >= 0) ws.getRange(rowIdx + 2, colIdx + 1).setValue(value);
}
