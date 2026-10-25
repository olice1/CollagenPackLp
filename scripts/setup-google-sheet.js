import dotenv from "dotenv";
dotenv.config();

import { setupSheetHeaders, SHEET_COLUMNS, getGoogleSheetsClient } from "../src/lib/google-sheets.js";

async function run() {
  console.log("==========================================");
  console.log("   AUREVA — Google Sheet Setup Script    ");
  console.log("==========================================");

  const sheetId = process.env.GOOGLE_SHEET_ID;
  const sheetName = process.env.GOOGLE_SHEET_NAME || "Sheet1";

  if (!sheetId) {
    console.error("❌ ERROR: GOOGLE_SHEET_ID is missing from your .env file.");
    console.log("Please check .env.example and create your .env with the spreadsheet ID.");
    process.exit(1);
  }

  const client = getGoogleSheetsClient();
  if (!client) {
    console.error("❌ ERROR: Google Service Account credentials are not configured in .env.");
    console.log("Please set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY.");
    process.exit(1);
  }

  console.log(`Connecting to Google Sheet: ${sheetId} (Tab: ${sheetName})...`);

  try {
    const result = await setupSheetHeaders(sheetId, sheetName);
    console.log("✅ Success!", result.message);
    console.log("\nRegistered Columns in Row 1:");
    SHEET_COLUMNS.forEach((col, idx) => {
      console.log(`  ${String.fromCharCode(65 + idx)}: ${col}`);
    });
    console.log("\nYour Google Sheet is now ready to receive orders from AUREVA!");
  } catch (err) {
    console.error("❌ Failed to setup Google Sheet:", err.message);
    if (err.message.includes("The caller does not have permission")) {
      console.log("\n⚠️ TIP: Make sure you shared the Google Sheet with your Service Account email with 'Editor' permissions!");
    }
    process.exit(1);
  }
}

run();
