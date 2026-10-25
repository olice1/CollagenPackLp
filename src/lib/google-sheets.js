import { google } from "googleapis";

export const SHEET_COLUMNS = [
  "order_id",
  "created_at",
  "customer_name",
  "phone",
  "city",
  "delivery_address",
  "quantity",
  "product_price",
  "delivery_fee",
  "total_amount",
  "status",
  "contact_notes",
  "updated_at",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid"
];

/**
 * Returns an authenticated Google Sheets client, or null if credentials are not configured.
 */
export function getGoogleSheetsClient() {
  const jsonKey = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (privateKey) {
    // Replace escaped newlines if passed in environment variable
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

  let auth = null;

  if (jsonKey && jsonKey.trim().length > 0) {
    try {
      const credentials = JSON.parse(jsonKey.trim());
      auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"]
      });
    } catch (err) {
      console.error("[GoogleSheets] Error parsing GOOGLE_SERVICE_ACCOUNT_JSON:", err.message);
      return null;
    }
  } else if (clientEmail && privateKey) {
    auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
  } else {
    // Credentials not provided (development or demo mode)
    return null;
  }

  return google.sheets({ version: "v4", auth });
}

/**
 * Ensures header row exists in the Google Sheet.
 */
export async function setupSheetHeaders(sheetId = process.env.GOOGLE_SHEET_ID, sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1") {
  const sheets = getGoogleSheetsClient();
  if (!sheets || !sheetId) {
    throw new Error("Google Sheets client or GOOGLE_SHEET_ID is missing.");
  }

  // Check existing first row
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A1:S1`
  });

  const rows = response.data.values;
  if (!rows || rows.length === 0 || rows[0].length === 0) {
    // Append headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:S1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [SHEET_COLUMNS]
      }
    });
    return { initialized: true, message: "Headers created successfully." };
  }

  return { initialized: false, message: "Headers already exist." };
}

/**
 * Appends a new order to the Google Sheet.
 */
export async function appendOrderToSheet(orderData) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";
  const sheets = getGoogleSheetsClient();

  if (!sheets || !sheetId) {
    console.warn("[GoogleSheets] Service account or Sheet ID not configured. Row not saved to real Google Sheet.");
    return { saved: false, reason: "NOT_CONFIGURED" };
  }

  // Check for duplicate order ID in column A
  const existingRows = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:A`
  });

  if (existingRows.data.values) {
    const existingIds = existingRows.data.values.map(row => row[0]);
    if (existingIds.includes(orderData.order_id)) {
      console.warn(`[GoogleSheets] Duplicate order ID detected: ${orderData.order_id}`);
      return { saved: false, reason: "DUPLICATE_ORDER_ID" };
    }
  }

  const rowValues = [
    orderData.order_id || "",
    orderData.created_at || new Date().toISOString(),
    orderData.customer_name || "",
    orderData.phone || "",
    orderData.city || "",
    orderData.delivery_address || "",
    orderData.quantity || 1,
    orderData.product_price || 295,
    orderData.delivery_fee || 35,
    orderData.total_amount || 330,
    orderData.status || "NEW",
    orderData.contact_notes || "",
    orderData.updated_at || new Date().toISOString(),
    orderData.utm_source || "",
    orderData.utm_medium || "",
    orderData.utm_campaign || "",
    orderData.utm_content || "",
    orderData.utm_term || "",
    orderData.fbclid || ""
  ];

  const appendRes = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:S`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [rowValues]
    }
  });

  return { saved: true, updatedRange: appendRes.data.updates?.updatedRange };
}

/**
 * Finds order by order_id in column A and updates status, contact_notes, and updated_at.
 */
export async function updateOrderInSheet(orderId, newStatus, notes = "") {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";
  const sheets = getGoogleSheetsClient();

  if (!sheets || !sheetId) {
    throw new Error("Google Sheets credentials or GOOGLE_SHEET_ID not configured.");
  }

  // Read column A to locate row number
  const colARes = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:A`
  });

  const rows = colARes.data.values || [];
  let targetRowIndex = -1;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] && rows[i][0].toString().trim() === orderId.toString().trim()) {
      targetRowIndex = i + 1; // 1-indexed for Sheets API
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error(`Order ID "${orderId}" was not found in the Google Sheet.`);
  }

  const updatedAt = new Date().toISOString();

  // Column K is status (11th column), L is contact_notes (12th), M is updated_at (13th)
  // Let's update K to M
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!K${targetRowIndex}:M${targetRowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[newStatus, notes, updatedAt]]
    }
  });

  return {
    success: true,
    rowIndex: targetRowIndex,
    orderId,
    newStatus,
    updatedAt
  };
}
