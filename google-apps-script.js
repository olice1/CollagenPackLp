/**
 * ===================================================================
 * AUREVA — Google Sheet Order Receiver + Meta Conversions API (CAPI)
 * Full COD Lifecycle Tracking: Lead ➔ Confirmed ➔ In Delivery ➔ Purchase (Sale) / Return
 * Sheet: "Collagen pack" (ID: 1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A)
 * ===================================================================
 */

var META_PIXEL_ID = "2176488913254071";
var META_CAPI_TOKEN = "EAAXhbW8hKh8BSZCYGupxh0Cz0YymrEKcquu6q3ufbrAqsGxmJH4HZBDdcwUPEVSaBmiK2NpsCp9A3pBExVr9SwOMbCZC4Fspeq4w1iu5yyiC6AAN28qmsB8yPr0WcHMZAF3IMpvjDzZC0iQZCYde65NcZAgWkzDq8r5plZAMEbKZCVRHlc4xhti5VOZBKYGuGxAyUyfwZDZD";

/**
 * 1. Handles New Orders Submitted from the Website (Fires 'Lead' event)
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    var data = {};
    if (e && e.postData && e.postData.contents) {
      try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var headers = [
      "رقم الطلب (Order ID)",
      "تاريخ الطلب (Date & Time)",
      "اسم العميل (Client)",
      "رقم الهاتف (Phone)",
      "المدينة (City)",
      "العنوان والحي (Address)",
      "عدد الباكات (Packs)",
      "المجموع للدفع (Total DH)",
      "قيمة التخفيض (Discount DH)",
      "الحالة (Status)",
      "واتساب العميل (WhatsApp Link)",
      "المصدر (UTM Source)",
      "الحملة (UTM Campaign)",
      "معرّف الإعلان (fbclid)",
      "ملاحظات وتتبع Meta (Meta Sync)"
    ];

    // Create styled header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#0f4c5c");
      headerRange.setFontColor("#ffffff");
      headerRange.setHorizontalAlignment("center");
      headerRange.setVerticalAlignment("middle");
      sheet.setRowHeight(1, 38);
      sheet.setFrozenRows(1);
    }

    var rawPhone = String(data.phone || "").replace(/\s+/g, "");
    var waDigits = rawPhone.indexOf("0") === 0 ? "212" + rawPhone.substring(1) : rawPhone;
    var waUrl = "https://wa.me/" + waDigits;
    var casablancaTime = Utilities.formatDate(new Date(), "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss");

    var row = [
      data.order_id || ("AUR-" + Date.now().toString().slice(-6)),
      casablancaTime,
      data.customer_name || "",
      "'" + rawPhone,
      data.city || "",
      data.delivery_address || "",
      data.quantity || 1,
      data.total_amount || 330,
      data.discount || 0,
      "NEW",
      waUrl,
      data.utm_source || "",
      data.utm_campaign || "",
      data.fbclid || "",
      "Lead tracked via Website"
    ];

    sheet.appendRow(row);

    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 4).setHorizontalAlignment("center");
    sheet.getRange(lastRow, 7, 1, 3).setHorizontalAlignment("center");

    // Add Status dropdown validation to column J (Status)
    setupStatusDropdown(sheet, lastRow);

    // Track Meta CAPI 'Lead' event
    try {
      sendMetaCAPIEvent("Lead", data, waDigits, Number(data.total_amount) || 330);
    } catch (capiErr) {
      Logger.log("Lead CAPI Error: " + capiErr.toString());
    }

    return ContentService.createTextOutput(JSON.stringify({ result: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 2. AUTOMATIC STATUS CHANGE TRIGGER (onEdit)
 * When you change Column J (الحالة) in Google Sheets:
 * - If you select 'DELIVERED' ➔ Sends 'Purchase' to Meta CAPI!
 * - If you select 'CONFIRMED' ➔ Sends 'Schedule' or confirms qualified lead!
 */
function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var col = e.range.getColumn();

  // Only trigger when editing Column J (Column 10: الحالة / Status) on data rows
  if (col !== 10 || row < 2) return;

  var newStatus = String(e.value || "").toUpperCase().trim();
  var notesCell = sheet.getRange(row, 15); // Column O: Notes
  var existingNotes = String(notesCell.getValue() || "");

  var orderId = sheet.getRange(row, 1).getValue();
  var rawPhone = sheet.getRange(row, 4).getValue().toString().replace(/'/g, "").replace(/\s+/g, "");
  var waDigits = rawPhone.indexOf("0") === 0 ? "212" + rawPhone.substring(1) : rawPhone;
  var totalAmount = Number(sheet.getRange(row, 8).getValue()) || 330;
  var clientName = sheet.getRange(row, 3).getValue();
  var city = sheet.getRange(row, 5).getValue();
  var casablancaTime = Utilities.formatDate(new Date(), "Africa/Casablanca", "yyyy-MM-dd HH:mm");

  var orderData = {
    order_id: orderId,
    customer_name: clientName,
    city: city
  };

  // Case A: Package is DELIVERED (Sale completed & cash collected)
  if (newStatus === "DELIVERED" || newStatus === "LIVRE" || newStatus === "تم التسليم") {
    if (existingNotes.indexOf("Purchase Sent") === -1) {
      sendMetaCAPIEvent("Purchase", orderData, waDigits, totalAmount);
      notesCell.setValue("✅ Meta Purchase Sent (" + totalAmount + " DH) at " + casablancaTime);
      sheet.getRange(row, 10).setBackground("#dcfce7"); // light green
    }
  }

  // Case B: Order is CONFIRMED with customer
  else if (newStatus === "CONFIRMED" || newStatus === "مؤكد") {
    if (existingNotes.indexOf("Confirmed Tracked") === -1) {
      notesCell.setValue("📞 Confirmed at " + casablancaTime);
      sheet.getRange(row, 10).setBackground("#e0f2fe"); // light blue
    }
  }

  // Case C: Order is IN DELIVERY
  else if (newStatus === "IN_DELIVERY" || newStatus === "قيد التوصيل" || newStatus === "EN LIVRAISON") {
    sheet.getRange(row, 10).setBackground("#fef9c3"); // light yellow
  }

  // Case D: Order is RETURNED / CANCELLED
  else if (newStatus === "RETURNED" || newStatus === "مرتجع" || newStatus === "CANCELLED" || newStatus === "ملغي") {
    notesCell.setValue("❌ " + newStatus + " at " + casablancaTime);
    sheet.getRange(row, 10).setBackground("#fee2e2"); // light red
  }
}

/**
 * 3. Sets up a nice dropdown in Column J (الحالة / Status)
 */
function setupStatusDropdown(sheet, rowIndex) {
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      "NEW",
      "CONFIRMED",
      "IN_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED"
    ], true)
    .setAllowInvalid(false)
    .build();

  sheet.getRange(rowIndex, 10).setDataValidation(rule);
}

/**
 * 4. Custom Menu in Google Sheets: Run "Setup All Dropdowns" once to format existing rows
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🌿 AUREVA CRM")
    .addItem("تفعيل القوائم المنسدلة لجميع الصفوف (Setup Dropdowns)", "formatAllStatusCells")
    .addToUi();
}

function formatAllStatusCells() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    for (var r = 2; r <= lastRow; r++) {
      setupStatusDropdown(sheet, r);
    }
  }
  SpreadsheetApp.getUi().alert("تم تفعيل القائمة المنسدلة (NEW, CONFIRMED, IN_DELIVERY, DELIVERED, CANCELLED, RETURNED) بنجاح!");
}

/**
 * 5. General Meta Conversions API (CAPI) Dispatcher
 */
function sendMetaCAPIEvent(eventName, orderData, waPhone, value) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return;

  var hashedPhone = sha256(waPhone);
  var firstName = (orderData.customer_name || "").split(" ")[0].trim().toLowerCase();
  var hashedName = firstName ? sha256(firstName) : undefined;
  var city = (orderData.city || "").trim().toLowerCase();
  var hashedCity = city ? sha256(city) : undefined;

  var eventId = eventName.toLowerCase() + "_" + (orderData.order_id || Date.now());

  var payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: "https://aur-eva.com/",
        action_source: "website",
        user_data: {
          ph: [hashedPhone],
          fn: hashedName ? [hashedName] : undefined,
          ct: hashedCity ? [hashedCity] : undefined,
          country: [sha256("ma")]
        },
        custom_data: {
          currency: "MAD",
          value: Number(value) || 330,
          content_name: "Pack Articulations & Mobilité",
          order_id: orderData.order_id
        }
      }
    ]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var apiUrl = "https://graph.facebook.com/v19.0/" + META_PIXEL_ID + "/events?access_token=" + META_CAPI_TOKEN;
  UrlFetchApp.fetch(apiUrl, options);
}

function sha256(input) {
  if (!input) return "";
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input).trim().toLowerCase(), Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < raw.length; i++) {
    var b = raw[i] < 0 ? raw[i] + 256 : raw[i];
    var h = b.toString(16);
    hex += (h.length === 1 ? "0" : "") + h;
  }
  return hex;
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ status: "online", message: "AUREVA Google Sheet Order Receiver is active and ready!" })).setMimeType(ContentService.MimeType.JSON);
}
