/**
 * MoneyFlow V2 - Supabase to Google Sheets Sync
 * Last Updated: 2026-05-30 | Task: 05-2-1-Sync-Bonus-Parser
 * LAYOUT: A-K (data), M-O (summary — fixed, never shifts)
 * A: ID (Hidden) | B: Type | C: Date (DD-MM) | D: Shop (ARRAYFORMULA from K) | E: Notes
 * F: Amount | G: % Back | H: đ Back | I: Σ Back | J: Final | K: Src (shop_source)
 */

// ---------------------------------------------------------------------------
// UI Menu — runs when spreadsheet opens
// ---------------------------------------------------------------------------

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Flow')
    .addItem('Push Manual Rows to DB', 'pushManualToDB')
    .addToUi();
}

function pushManualToDB() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var tabName = sheet.getName();

  // Extract cycle from tab name (e.g., "2026-06" -> "2026-06")
  var cycleMatch = tabName.match(/(\d{4}-\d{2})/);
  if (!cycleMatch) {
    SpreadsheetApp.getUi().alert('Error: Tab name must contain YYYY-MM format (e.g., "2026-06")');
    return;
  }
  var cycle = cycleMatch[1];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('No data rows found.');
    return;
  }

  var data = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  var manualRows = [];
  var totalIn = 0;
  var totalOut = 0;
  var inCount = 0;
  var outCount = 0;

  for (var i = 0; i < data.length; i++) {
    var id = data[i][0];        // A: ID
    var type = data[i][1];      // B: Type (In/Out)
    var amount = data[i][5];    // F: Amount

    // Find rows with empty ID (manual input)
    if (!id || id === '') {
      manualRows.push({ row: i + 2, type: type, amount: amount });
      if (type === 'In') {
        totalIn += amount;
        inCount++;
      } else {
        totalOut += amount;
        outCount++;
      }
    }
  }

  if (manualRows.length === 0) {
    SpreadsheetApp.getUi().alert('No manual rows found (all rows have ID).');
    return;
  }

  // Format + mark rows as synced
  for (var j = 0; j < manualRows.length; j++) {
    var r = manualRows[j].row;
    var rowRange = sheet.getRange(r, 1, 1, 11);

    // Apply border
    rowRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
    rowRange.setFontSize(11);

    // Color: green for In, default for Out
    if (manualRows[j].type === 'In') {
      rowRange.setBackground('#dcfce7');
    }

    // Mark as synced (column A)
    sheet.getRange(r, 1).setValue('synced-lump-sum');
  }

  // Build summary notes
  var summaryParts = [];
  if (totalIn > 0) summaryParts.push(inCount + ' In: ' + totalIn.toLocaleString());
  if (totalOut > 0) summaryParts.push(outCount + ' Out: ' + totalOut.toLocaleString());
  var summaryNotes = 'Lump sum ' + cycle + ' [' + summaryParts.join(', ') + '] - manual';

  // Call lump-sum API for In transactions
  if (totalIn > 0) {
    var payloadIn = {
      cycle: cycle,
      amount: totalIn,
      type: 'income',
      notes: summaryNotes
    };
    // TODO: Replace with actual API URL
    // UrlFetchApp.fetch('https://your-app.vercel.app/api/transactions/lump-sum', {
    //   method: 'post',
    //   contentType: 'application/json',
    //   payload: JSON.stringify(payloadIn)
    // });
  }

  // Call lump-sum API for Out transactions
  if (totalOut > 0) {
    var payloadOut = {
      cycle: cycle,
      amount: totalOut,
      type: 'expense',
      notes: summaryNotes
    };
    // TODO: Replace with actual API URL
    // UrlFetchApp.fetch('https://your-app.vercel.app/api/transactions/lump-sum', {
    //   method: 'post',
    //   contentType: 'application/json',
    //   payload: JSON.stringify(payloadOut)
    // });
  }

  SpreadsheetApp.getUi().alert(
    'Done!\n\n' +
    'Manual rows: ' + manualRows.length + '\n' +
    'Total In: ' + totalIn.toLocaleString() + '\n' +
    'Total Out: ' + totalOut.toLocaleString() + '\n' +
    'Cycle: ' + cycle + '\n\n' +
    'Notes: ' + summaryNotes
  );
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Server busy" })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var payload = JSON.parse(e.postData.contents);

    var action = payload.type;
    var record = payload.record;

    if (!record || !record.id) {
      throw new Error("Invalid record data: " + JSON.stringify(payload));
    }

    // 1. TÌM HOẶC TẠO TAB THEO cycle_tag
    var tabName = record.cycle_tag || "Default";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(tabName);

    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    // 2. LUÔN đảm bảo header + format (không skip)
    ensureSetup(sheet);

    // 3. TÌM ROW THEO ID
    var rowIndex = findRowById(sheet, record.id);

    // 4. DELETE
    if (action === "DELETE" || record.status === "void") {
      if (rowIndex > -1) {
        sheet.deleteRow(rowIndex);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, action: "deleted" })).setMimeType(ContentService.MimeType.JSON);
    }

    // 5. MAP DATA
    var type = "Out";
    if (record.type === "income" || record.type === "repayment" || record.type === "transfer_in" || record.type === "cashback") {
      type = "In";
    }

    var rowData = [
      record.id,                    // A: ID
      type,                         // B: Type
      formatDate(record.occurred_at),           // C: Date (DD-MM)
      "",                           // D: Shop (ARRAYFORMULA)
      record.notes || "",           // E: Notes
      record.amount || 0,           // F: Amount
      record.cashback_share_percent || 0, // G: % Back
      record.cashback_share_fixed || 0,   // H: đ Back
      "",                           // I: Σ Back (ARRAYFORMULA)
      "",                           // J: Final Price (ARRAYFORMULA)
      record.shop_source || ""      // K: Src (shop name, NOT raw_input)
    ];

    // 6. INSERT or UPDATE
    if (rowIndex > -1) {
      sheet.getRange(rowIndex, 1, 1, 11).setValues([rowData]);
    } else {
      var nextRow = getNextDataRow(sheet);
      sheet.getRange(nextRow, 1, 1, 11).setValues([rowData]);
    }

    // 7. ALWAYS re-apply formatting + formulas on affected rows
    applyAllFormatting(sheet);
    applyArrayFormulas(sheet);

    return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format date: "2026-05-29T..." → "29-05" */
function formatDate(isoStr) {
  if (!isoStr) return "";
  var parts = isoStr.split("T")[0].split("-");
  if (parts.length < 3) return isoStr;
  return parts[2] + "-" + parts[1];
}

function findRowById(sheet, id) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function getNextDataRow(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return 2;
  var colA = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (var i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== "" && colA[i][0] !== null) return i + 3;
  }
  return 2;
}

// ---------------------------------------------------------------------------
// Formatting — ALWAYS runs, never skips
// ---------------------------------------------------------------------------

/**
 * Find actual last data row by scanning column A (ignores formatting-only rows)
 */
function getLastDataRow(sheet) {
  var colA = sheet.getRange("A:A").getValues();
  for (var i = colA.length - 1; i >= 0; i--) {
    if (colA[i][0] !== "" && colA[i][0] !== null) return i + 1;
  }
  return 1;
}

function applyAllFormatting(sheet) {
  var lastDataRow = getLastDataRow(sheet);
  if (lastDataRow < 2) return;

  var numRows = lastDataRow - 1;

  // Color + border each data row individually (only rows with actual data)
  var types = sheet.getRange(2, 2, numRows, 1).getValues();
  // Check backgrounds across columns B-E (more reliable than just column A)
  var backgrounds = sheet.getRange(2, 2, numRows, 4).getBackgrounds();

  for (var i = 0; i < numRows; i++) {
    var row = i + 2;
    var rowRange = sheet.getRange(row, 1, 1, 11);

    // Black border, all 4 sides + inner lines
    rowRange.setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);

    // Font
    rowRange.setFontSize(11);

    // Preserve manual highlighting: check if ANY cell in B-E has custom color
    var hasHighlight = false;
    for (var c = 0; c < 4; c++) {
      var bg = backgrounds[i][c];
      if (bg && bg !== "#dcfce7" && bg !== "#ffffff" && bg !== "") {
        hasHighlight = true;
        break;
      }
    }

    if (!hasHighlight) {
      if (types[i][0] === "In") {
        rowRange.setBackground("#dcfce7");
      } else {
        rowRange.setBackground(null);
      }
    }
    // else: keep manual highlight (yellow, etc.)
  }

  // Summary borders (M2:O5) — all sides + inner lines, black
  sheet.getRange("M2:O5").setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange("M2:O5").setFontSize(11);
  sheet.getRange("O2:O5").setNumberFormat("#,##0");
  sheet.getRange("M5:O5").setBackground("#fce7f3").setFontWeight("bold");

  // Auto-resize column E (Notes) to fit longest content (no wrap, expand width)
  sheet.getRange("E2:E1000").setWrap(false);
  sheet.autoResizeColumn(5);
}

// ---------------------------------------------------------------------------
// Setup — runs EVERY time to ensure headers + summary exist
// ---------------------------------------------------------------------------

function ensureSetup(sheet) {
  // === HEADER ROW (always ensure it exists) ===
  if (sheet.getRange("A1").getValue() === "") {
    var headers = ["ID", "Type", "Date", "Shop", "Notes", "Amount", "% Back", "đ Back", "Σ Back", "Final Price", "Src"];
    sheet.getRange("A1:K1").setValues([headers]);
    sheet.setFrozenRows(1);

    // Hide A and K (always, not just on first setup)
    sheet.hideColumns(1);
    sheet.hideColumns(11);
  }

  // Always ensure A and K are hidden (in case sheet was unhidden manually)
  try { sheet.hideColumns(1); } catch (e) {}
  try { sheet.hideColumns(11); } catch (e) {}

  // Always re-apply header style (in case sheet was manually edited)
  sheet.getRange("A1:K1")
    .setFontWeight("bold")
    .setFontSize(11)
    .setBackground("#4f46e5")
    .setFontColor("#FFFFFF")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  // === COLUMN WIDTHS ===
  sheet.setColumnWidth(2, 50);   // B: Type
  sheet.setColumnWidth(3, 85);   // C: Date
  sheet.setColumnWidth(4, 80);   // D: Shop (compact)
  // E: Notes — auto-resize to fit content (see applyAllFormatting)
  sheet.setColumnWidth(6, 100);  // F: Amount
  sheet.setColumnWidth(7, 55);   // G: % Back
  sheet.setColumnWidth(8, 75);   // H: đ Back
  sheet.setColumnWidth(9, 85);   // I: Σ Back
  sheet.setColumnWidth(10, 100); // J: Final Price
  sheet.setColumnWidth(12, 15);  // L: gap

  // === ALIGNMENT ===
  // Center align for Type, Date, Shop columns
  sheet.getRange("B2:B1000").setHorizontalAlignment("center");
  sheet.getRange("C2:C1000").setHorizontalAlignment("center");
  sheet.getRange("D2:D1000").setHorizontalAlignment("center");
  // Right align for amount columns
  sheet.getRange("F2:F1000").setHorizontalAlignment("right");
  sheet.getRange("G2:G1000").setHorizontalAlignment("right");
  sheet.getRange("H2:H1000").setHorizontalAlignment("right");
  sheet.getRange("I2:I1000").setHorizontalAlignment("right");
  sheet.getRange("J2:J1000").setHorizontalAlignment("right");

  // === NUMBER FORMATS ===
  sheet.getRange("F2:F1000").setNumberFormat("#,##0");
  sheet.getRange("G2:G1000").setNumberFormat("#,##0");
  sheet.getRange("H2:H1000").setNumberFormat("#,##0");
  sheet.getRange("I2:I1000").setNumberFormat("#,##0");
  sheet.getRange("J2:J1000").setNumberFormat("#,##0");

  // === DEFAULT FONT ===
  sheet.getRange("A1:Z1000").setFontSize(11);

  // === SUMMARY TABLE ===
  if (sheet.getRange("M1").getValue() === "") {
    sheet.getRange("M1:O1").setValues([["No.", "Summary", "Value"]]);
    sheet.getRange("M2:N2").setValues([[1, "In (Gross)"]]);
    sheet.getRange("M3:N3").setValues([[2, "Out (Gross)"]]);
    sheet.getRange("M4:N4").setValues([[3, "Total Back"]]);
    sheet.getRange("M5:N5").setValues([[4, "Remains"]]);
  }

  // Always re-apply summary formulas (they may break on manual edits)
  sheet.getRange("O2").setFormula('=SUMIFS(F:F;B:B;"In") * -1');
  sheet.getRange("O3").setFormula('=SUMIFS(F:F;B:B;"Out")');
  sheet.getRange("O4").setFormula("=SUM(I:I)");
  sheet.getRange("O5").setFormula("=SUM(J:J)");

  // Summary header style — ALWAYS
  sheet.getRange("M1:O1")
    .setFontWeight("bold")
    .setFontSize(11)
    .setBackground("#4f46e5")
    .setFontColor("#FFFFFF")
    .setBorder(true, true, true, true, true, true, "#000000", SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.setColumnWidth(13, 40);
  sheet.setColumnWidth(14, 100);
  sheet.setColumnWidth(15, 100);
}

function applyArrayFormulas(sheet) {
  // D: Shop — VLOOKUP from K via Shop sheet
  sheet.getRange("D1").setFormula(
    '={"Shop"; ARRAYFORMULA(IF(K2:K=""; ""; LET(' +
    'mappedRaw; IFERROR(VLOOKUP(TRIM(K2:K); Shop!A:B; 2; FALSE); ""); ' +
    'mapped; IF(mappedRaw=""; TRIM(K2:K); mappedRaw); ' +
    'IF(LEFT(mapped; 4)="http"; IMAGE(mapped; 1); mapped))))}'
  );

  // I: Σ Back
  sheet.getRange("I1").setFormula(
    '={"Σ Back"; ARRAYFORMULA(IF(F2:F=""; ""; (F2:F * G2:G / 100) + H2:H))}'
  );

  // J: Final Price
  sheet.getRange("J1").setFormula(
    '={"Final Price"; ARRAYFORMULA(IF(F2:F=""; ""; IF(B2:B="In"; (-F2:F) + I2:I; F2:F - I2:I)))}'
  );
}
