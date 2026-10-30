/**
 * VARUNASETU — Real Data Seeding Audit Script
 * Reads the master Excel workbook and compares against cable-data.ts
 * Run: node scripts/audit-seeding.js
 */

const XLSX = require('xlsx');
const path = require('path');

const WORKBOOK_PATH = 'C:/Users/ojasv/Downloads/VARUNASETU_MASTER_ALL_DATASETS.xlsx';

const wb = XLSX.readFile(WORKBOOK_PATH);
console.log('\n=== VARUNASETU MASTER WORKBOOK — SEEDING AUDIT ===\n');
console.log(`Total sheets: ${wb.SheetNames.length}`);
console.log('Sheet names:', wb.SheetNames.join(', '));
console.log('\n');

// ── 1. Check Cables_Primary sheet ──────────────────────────────────────────
const CABLE_SHEETS = wb.SheetNames.filter(n =>
  /cable|route|system/i.test(n)
);
console.log('Cable-related sheets:', CABLE_SHEETS.join(', '));

CABLE_SHEETS.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`\n[${sheetName}] rows: ${data.length}`);
  if (data.length > 0) {
    const keys = Object.keys(data[0]);
    console.log(`  Columns: ${keys.join(', ')}`);
    // Print first 3 rows to see actual names
    data.slice(0, 5).forEach((row, i) => {
      const id = row['Cable ID'] || row['cable_id'] || row['ID'] || row['id'] || row['Name'] || row['cable_name'] || '';
      const name = row['Cable Name'] || row['name'] || row['cable_name'] || row['System'] || '';
      const len = row['Length (km)'] || row['length_km'] || row['length'] || row['Length'] || '';
      const cap = row['Capacity (Tbps)'] || row['capacity_tbps'] || row['design_capacity'] || row['Capacity'] || '';
      console.log(`  Row ${i+1}: id="${id}" name="${name}" length="${len}" capacity="${cap}"`);
    });
  }
});

// ── 2. Check Landing Station sheets ────────────────────────────────────────
const LS_SHEETS = wb.SheetNames.filter(n =>
  /landing|station|cls|terminal|beach/i.test(n)
);
console.log('\nLanding station sheets:', LS_SHEETS.join(', ') || 'none found');

LS_SHEETS.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`\n[${sheetName}] rows: ${data.length}`);
  if (data.length > 0) {
    console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
    data.slice(0, 3).forEach((row, i) => {
      console.log(`  Row ${i+1}: ${JSON.stringify(row).slice(0, 200)}`);
    });
  }
});

// ── 3. Check Incidents / Faults sheet ──────────────────────────────────────
const INCIDENT_SHEETS = wb.SheetNames.filter(n =>
  /incident|fault|failure|break|event/i.test(n)
);
console.log('\nIncident sheets:', INCIDENT_SHEETS.join(', ') || 'none found');
INCIDENT_SHEETS.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`\n[${sheetName}] rows: ${data.length}`);
  if (data.length > 0) {
    console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
  }
});

// ── 4. Check Vessel sheets ─────────────────────────────────────────────────
const VESSEL_SHEETS = wb.SheetNames.filter(n =>
  /vessel|ship|repair|fleet|cs_/i.test(n)
);
console.log('\nVessel sheets:', VESSEL_SHEETS.join(', ') || 'none found');
VESSEL_SHEETS.forEach(sheetName => {
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`\n[${sheetName}] rows: ${data.length}`);
  if (data.length > 0) {
    console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
    data.slice(0, 3).forEach((row, i) => {
      console.log(`  Row ${i+1}: ${JSON.stringify(row).slice(0, 200)}`);
    });
  }
});

// ── 5. Summary of all sheet sizes ──────────────────────────────────────────
console.log('\n=== ALL SHEETS SUMMARY ===');
wb.SheetNames.forEach(n => {
  const sheet = wb.Sheets[n];
  const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  console.log(`  ${n}: ${data.length} rows`);
});
