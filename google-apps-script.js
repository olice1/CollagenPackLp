/**
 * ===================================================================
 * AUREVA — Google Apps Script for Google Sheets Order Management
 * Sheet: "Collagen pack" (ID: 1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A)
 * ===================================================================
 * 
 * 📋 3-STEP INSTALLATION GUIDE (Takes 1 Minute):
 * 
 * 1. Open your Google Sheet ("Collagen pack"):
 *    https://docs.google.com/spreadsheets/d/1NWTDQlS7zmmNQLUUn5toz1sryS4UwvEPWY7NyJXwA6A/edit
 * 
 * 2. In the top menu of Google Sheets, click:
 *    Extensions (الإضافات) > Apps Script
 * 
 * 3. Delete everything in the editor, PASTE THIS ENTIRE SCRIPT, then:
 *    - Click the blue "Deploy" (نشر) button in top-right > "New deployment" (توزيع جديد)
 *    - Click the gear icon ⚙️ next to "Select type" > choose "Web app" (تطبيق ويب)
 *    - Description: AUREVA Orders Receiver
 *    - Execute as (التنفيذ بتفويض من): Me (حسابي)
 *    - Who has access (من يملك حق الوصول): Anyone (أي شخص)  <-- VERY IMPORTANT!
 *    - Click "Deploy" (نشر) > "Authorize access" (منح حق الوصول) > Allow.
 *    - COPY the "Web app URL" (starts with https://script.google.com/macros/s/...)
 * 
 * 4. Paste that Web App URL into your js/config.js file under `googleSheet.webAppUrl`.
 * ===================================================================
 */

// Configuration
var META_PIXEL_ID = "2176488913254071";
var META_CAPI_TOKEN = "EAAXhbW8hKh8BSZCYGupxh0Cz0YymrEKcquu6q3ufbrAqsGxmJH4HZBDdcwUPEVSaBmiK2NpsCp9A3pBExVr9SwOMbCZC4Fspeq4w1iu5yyiC6AAN28qmsB8yPr0WcHMZAF3IMpvjDzZC0iQZCYde65NcZAgWkzDq8r5plZAMEbKZCVRHlc4xhti5VOZBKYGuGxAyUyfwZDZD";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();

    // 1. Parse incoming order data (handles JSON, Form, and raw text)
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    // 2. Initialize Headers if sheet is blank
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
      "ملاحظات (Notes)"
    ];

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

    // 3. Format Phone Number
    var rawPhone = String(data.phone || "").replace(/\s+/g, "");
    var waDigits = rawPhone;
    if (waDigits.indexOf("0") === 0) {
      waDigits = "212" + waDigits.substring(1);
    }
    var waUrl = "https://wa.me/" + waDigits;

    // 4. Casablanca local timestamp
    var casablancaTime = Utilities.formatDate(new Date(), "Africa/Casablanca", "yyyy-MM-dd HH:mm:ss");

    var row = [
      data.order_id || ("AUR-" + Date.now().toString().slice(-6)),
      casablancaTime,
      data.customer_name || "",
      "'" + rawPhone, // Apostrophe forces text format so leading 0 isn't stripped
      data.city || "",
      data.delivery_address || "",
      data.quantity || 1,
      data.total_amount || 330,
      data.discount || 0,
      data.status || "NEW",
      waUrl,
      data.utm_source || "",
      data.utm_campaign || "",
      data.fbclid || "",
      data.contact_notes || ""
    ];

    sheet.appendRow(row);

    // Format new row
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, headers.length).setVerticalAlignment("middle");
    sheet.getRange(lastRow, 4).setHorizontalAlignment("center"); // phone
    sheet.getRange(lastRow, 7, 1, 3).setHorizontalAlignment("center"); // qty, total, discount

    // 5. Send Server-Side Meta Conversions API (CAPI) Event
    try {
      sendMetaCAPILead(data, waDigits, casablancaTime);
    } catch (capiErr) {
      Logger.log("Meta CAPI Error: " + capiErr.toString());
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", order_id: row[0], row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("doPost Error: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Health check when opening the Web App URL in a browser
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "online",
      message: "AUREVA Google Sheet Order Receiver is active and ready!",
      sheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Server-Side Meta Conversions API (CAPI) Lead Dispatcher from Google Apps Script
 */
function sendMetaCAPILead(orderData, waPhone, timestamp) {
  if (!META_PIXEL_ID || !META_CAPI_TOKEN) return;

  var hashedPhone = sha256(waPhone);
  var firstName = (orderData.customer_name || "").split(" ")[0].trim().toLowerCase();
  var hashedName = firstName ? sha256(firstName) : undefined;
  var city = (orderData.city || "").trim().toLowerCase();
  var hashedCity = city ? sha256(city) : undefined;

  var payload = {
    data: [
      {
        event_name: "Lead",
        event_time: Math.floor(Date.now() / 1000),
        event_id: orderData.event_id || ("lead_" + (orderData.order_id || Date.now())),
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
          value: Number(orderData.total_amount) || 330,
          content_name: "Pack Articulations & Mobilité",
          content_type: "product",
          order_id: orderData.order_id,
          num_items: Number(orderData.quantity) || 1
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

/**
 * Helper SHA-256 Hasher for Meta user data
 */
function sha256(input) {
  if (!input) return "";
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input).trim().toLowerCase(), Utilities.Charset.UTF_8);
  var hex = "";
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = "0" + byteHex;
    hex += byteHex;
  }
  return hex;
}
