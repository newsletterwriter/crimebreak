/**
 * Google Apps Script — Crime Break CSV importer
 *
 * Setup:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file
 * 3. Replace IMPORT_URL and IMPORT_SECRET with your values
 * 4. Run importStories() once manually to test
 * 5. Add a time-driven trigger: Triggers → Add Trigger → importStories → Time-driven → every N hours
 */

const IMPORT_URL = "https://your-crimebreak-domain.vercel.app/api/import/stories";
const IMPORT_SECRET = "your-import-secret-here";
const SHEET_NAME = "Stories"; // Tab name in your Google Sheet

function importStories() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log("Sheet not found: " + SHEET_NAME);
    return;
  }

  const csv = convertSheetToCsv(sheet);
  if (!csv) {
    Logger.log("Sheet is empty");
    return;
  }

  const response = UrlFetchApp.fetch(IMPORT_URL, {
    method: "post",
    contentType: "text/csv",
    headers: {
      Authorization: "Bearer " + IMPORT_SECRET,
    },
    payload: csv,
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  Logger.log("Response " + code + ": " + body);

  if (code !== 200) {
    // Optionally email yourself on failure:
    // MailApp.sendEmail("your@email.com", "Crime Break import failed", body);
  }
}

function dryRunImport() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const csv = convertSheetToCsv(sheet);

  const response = UrlFetchApp.fetch(IMPORT_URL + "?dryRun=true", {
    method: "post",
    contentType: "text/csv",
    headers: { Authorization: "Bearer " + IMPORT_SECRET },
    payload: csv,
    muteHttpExceptions: true,
  });

  Logger.log("Dry run result: " + response.getContentText());
}

function convertSheetToCsv(sheet) {
  const data = sheet.getDataRange().getValues();
  if (!data.length) return null;

  return data
    .map((row) =>
      row
        .map((cell) => {
          const val = String(cell).replace(/"/g, '""');
          return val.includes(",") || val.includes("\n") || val.includes('"')
            ? `"${val}"`
            : val;
        })
        .join(",")
    )
    .join("\r\n");
}
