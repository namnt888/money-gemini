/**
 * Google Apps Script — doPost(e)
 *
 * Nhận JSON POST từ Supabase Edge Function và append vào Google Sheet.
 * Tự động tạo tab theo cycle_tag (VD: "2026-05") nếu chưa tồn tại.
 *
 * Layout: A:ID | B:Type | C:Date | D:Shop | E:Notes
 *         F:Amount | G:%Back | H:đBack | I:ΣBack | J:FinalPrice | K:ShopSource
 *
 * Hướng dẫn (manual):
 * 1. Mở Google Sheet → Extensions → Apps Script
 * 2. Paste toàn bộ code này vào
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy Web app URL → lưu vào cột sheet_webhook_url của bảng people
 *
 * Hoặc dùng clasp: pnpm run sheet:people
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

  var sheet = ss.getSheetByName(cycleTag);
  if (!sheet) {
    sheet = ss.insertSheet(cycleTag);
    setupSheet(sheet);
  }

  sheet.appendRow([
    data.id || '',
    data.type || '',
    data.date || '',
    data.shop || '',
    data.notes || '',
    data.amount || 0,
    data.percent_back || 0,
    data.fixed_back || 0,
    '',
    '',
    data.shop || '',
  ]);

  var lastRow = sheet.getLastRow();
  applyFormulasToRow(sheet, lastRow);

  return jsonResponse({ ok: true, action: 'create' });
}

function setupSheet(sheet) {
  var headers = ['ID', 'Type', 'Date', 'Shop', 'Notes', 'Amount', '% Back', 'đ Back', 'Σ Back', 'Final Price', 'ShopSource'];
  var headerRange = sheet.getRange('A1:K1');
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold')
    .setBackground('#4f46e5')
    .setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');
  sheet.setFrozenRows(1);

  try {
    sheet.hideColumns(1);
    sheet.hideColumns(11);
  } catch (e) {}

  sheet.setColumnWidth(2, 50);
  sheet.setColumnWidth(3, 80);
  sheet.setColumnWidth(4, 60);
  sheet.setColumnWidth(5, 300);
  sheet.setColumnWidth(6, 100);
  sheet.setColumnWidth(7, 65);
  sheet.setColumnWidth(8, 70);
  sheet.setColumnWidth(9, 75);
  sheet.setColumnWidth(10, 95);
}

function applyFormulasToRow(sheet, row) {
  sheet.getRange(row, 9).setFormula('=IF(F' + row + '=""; ""; F' + row + '*G' + row + '/100 + H' + row + ')');
  sheet.getRange(row, 10).setFormula('=IF(F' + row + '=""; ""; IF(B' + row + '="In"; -F' + row + '+I' + row + '; F' + row + '-I' + row + '))');
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
