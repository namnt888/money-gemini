/**
 * Money Flow — Google Apps Script (v1.0)
 * Updated: 2026-05-29 09:55:00
 *
 * Nhận JSON POST từ Supabase Edge Function và append vào Google Sheet.
 * Tự động tạo tab theo cycle_tag (VD: "2026-05") nếu chưa tồn tại.
 *
 * Layout: A:ID | B:Type | C:Date | D:Shop | E:Notes
 *         F:Amount | G:%Back | H:đBack | I:ΣBack | J:FinalPrice | K:ShopSource
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'create';

    if (action === 'create') {
      return handleCreate(data);
    }

    return jsonResponse({ error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

function handleCreate(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var cycleTag = data.cycle_tag || Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM');

  // Get or create tab by cycle_tag
  var sheet = ss.getSheetByName(cycleTag);
  if (!sheet) {
    sheet = ss.insertSheet(cycleTag);
    setupSheet(sheet);
  }

  // Append data row at columns A-K
  sheet.appendRow([
    data.id || '',
    data.type || '',
    data.date || '',
    data.shop || '',
    data.notes || '',
    data.amount || 0,
    data.percent_back || 0,
    data.fixed_back || 0,
    '',  // Σ Back (formula)
    '',  // Final Price (formula)
    data.shop || '',
  ]);

  // Apply formulas for the new row
  var lastRow = sheet.getLastRow();
  applyFormulasToRow(sheet, lastRow);

  return jsonResponse({ ok: true, action: 'create' });
}

function setupSheet(sheet) {
  // Header at A1:K1
  var headers = ['ID', 'Type', 'Date', 'Shop', 'Notes', 'Amount', '% Back', 'đ Back', 'Σ Back', 'Final Price', 'ShopSource'];
  var headerRange = sheet.getRange('A1:K1');
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold')
    .setBackground('#4f46e5')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  // Hide ID (A) and ShopSource (K)
  try {
    sheet.hideColumns(1);
    sheet.hideColumns(11);
  } catch (e) {}

  // Column widths
  sheet.setColumnWidth(2, 50);   // B: Type
  sheet.setColumnWidth(3, 80);   // C: Date
  sheet.setColumnWidth(4, 60);   // D: Shop
  sheet.setColumnWidth(5, 300);  // E: Notes
  sheet.setColumnWidth(6, 100);  // F: Amount
  sheet.setColumnWidth(7, 65);   // G: % Back
  sheet.setColumnWidth(8, 70);   // H: đ Back
  sheet.setColumnWidth(9, 75);   // I: Σ Back
  sheet.setColumnWidth(10, 95);  // J: Final Price

  // Conditional formatting for Type column
  var typeRange = sheet.getRange('B2:B1000');
  var fullRowRange = sheet.getRange('A2:J1000');

  var ruleIn = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B2="In"')
    .setBackground('#DCFCE7')
    .setRanges([fullRowRange])
    .build();

  var ruleOut = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$B2="Out"')
    .setBackground('#FFF1F1')
    .setRanges([typeRange])
    .build();

  sheet.setConditionalFormatRules([ruleIn, ruleOut]);
}

function applyFormulasToRow(sheet, row) {
  // I: Σ Back = (F * G / 100) + H
  sheet.getRange(row, 9).setFormula('=IF(F' + row + '=""; ""; F' + row + '*G' + row + '/100 + H' + row + ')');

  // J: Final Price = In: -F + I; Out: F - I
  sheet.getRange(row, 10).setFormula('=IF(F' + row + '=""; ""; IF(B' + row + '="In"; -F' + row + '+I' + row + '; F' + row + '-I' + row + '))');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ===== TEST FUNCTION =====
// Run this to test manually in Apps Script editor
function testCreate() {
  var result = handleCreate({
    action: "create",
    id: "test-" + new Date().getTime(),
    type: "Out",
    date: "2026-05-29",
    shop: "Test Shop",
    notes: "Manual test from Apps Script editor",
    amount: 50000,
    percent_back: 5,
    fixed_back: 2000,
    cycle_tag: "2026-05"
  });
  Logger.log(result);
}
