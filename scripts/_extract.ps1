
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$wb = $excel.Workbooks.Open("C:\\Users\\ojasv\\Downloads\\VARUNASETU_MASTER_ALL_DATASETS.xlsx")

function ReadSheet($sheetName) {
  $ws = $wb.Sheets | Where-Object { $_.Name -eq $sheetName }
  if (-not $ws) { return @() }
  $lastRow = $ws.UsedRange.Rows.Count
  $lastCol = $ws.UsedRange.Columns.Count
  $headers = @()
  for ($c = 1; $c -le $lastCol; $c++) { $headers += $ws.Cells(1,$c).Text }
  $rows = @()
  for ($r = 2; $r -le $lastRow; $r++) {
    $row = @{}
    for ($c = 1; $c -le $lastCol; $c++) {
      $row[$headers[$c-1]] = $ws.Cells($r,$c).Text
    }
    $rows += $row
  }
  return $rows
}

$cables = ReadSheet "A_cable_to_cable_systems"
$landingPoints = ReadSheet "A_cable_to_landing_point_master"
$cableLPRelations = ReadSheet "A_cable_to_landing_points_by_ca"
$incidents = ReadSheet "C_observed_geocables_incidents_"

$out = @{
  cables = $cables
  landingPoints = $landingPoints
  cableLPRelations = $cableLPRelations
  incidents = $incidents
}

$json = $out | ConvertTo-Json -Depth 5 -Compress
# Write without BOM (avoid Unexpected token '﻿' in Node.js JSON.parse)
$utf8NoBOM = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Resolve-Path "scripts").Path + "\workbook_data.json", $json, $utf8NoBOM)

Write-Host "DONE:cables=$($cables.Count),lp=$($landingPoints.Count),rel=$($cableLPRelations.Count),inc=$($incidents.Count)"

$wb.Close($false)
$excel.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
