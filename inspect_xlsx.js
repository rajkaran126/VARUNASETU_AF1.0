const path = require('path');
const nm = path.resolve('C:/Users/ojasv/OneDrive/Desktop/DB/VARUNASETU_AF1.0/node_modules');
const XLSX = require(path.join(nm, 'xlsx'));
const wb = XLSX.readFile('C:/Users/ojasv/Downloads/VARUNASETU_MASTER_ALL_DATASETS.xlsx');
const sheets = wb.SheetNames;
process.stdout.write('SHEET_COUNT:' + sheets.length + '\n');
process.stdout.write('SHEETS:' + JSON.stringify(sheets) + '\n');
sheets.forEach(sh => {
  const ws = wb.Sheets[sh];
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, range:0, defval:''});
  const headers = rows[0] || [];
  process.stdout.write(JSON.stringify({sheet:sh, rowCount:rows.length, headers}) + '\n');
});
