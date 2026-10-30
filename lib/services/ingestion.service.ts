/**
 * VARUNASETU Phase 4A — Data Ingestion Service
 *
 * Implements the staged ingestion pipeline:
 *   Upload/Source → Inspect → Schema Detection → Validate → Normalise →
 *   Associate → Quality Score → Provenance → Version → Publish → Audit
 *
 * Records that fail validation are quarantined with readable error messages.
 * Records are never silently discarded.
 */

import {
  IngestionJob,
  IngestionJobStatus,
  IngestionError,
  SchemaField,
  IngestFormat,
  IngestionZone,
  DatasetManifestEntry,
} from '../types-phase4a';
import { ProvenanceType } from '../types';

// Load manifest at module init — bundled statically by Next.js
let _manifest: { datasets?: DatasetManifestEntry[] } = { datasets: [] };
try {
  // eslint-disable-next-line
  _manifest = require('../../data/manifests/dataset_manifest.json') as { datasets?: DatasetManifestEntry[] };
} catch {
  // manifest not available in browser bundle — graceful fallback
  _manifest = { datasets: [] };
}

// Maximum accepted file size
const MAX_FILE_SIZE_MB = 50;
const ACCEPTED_EXTENSIONS = ['.csv', '.json', '.geojson', '.gpkg', '.xlsx'];

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectFormat(filename: string, content?: string): IngestFormat {
  const ext = filename.toLowerCase().split('.').pop() ?? '';
  if (ext === 'csv') return 'CSV';
  if (ext === 'xlsx') return 'XLSX';
  if (ext === 'gpkg') return 'GPKG';
  if (ext === 'geojson') return 'GeoJSON';
  if (ext === 'json') {
    // Peek content to distinguish GeoJSON from plain JSON
    if (content) {
      try {
        const parsed = JSON.parse(content.slice(0, 500));
        if (parsed?.type === 'FeatureCollection' || parsed?.type === 'Feature') return 'GeoJSON';
      } catch {}
    }
    return 'JSON';
  }
  return 'JSON';
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export function detectSchema(rows: Record<string, unknown>[]): SchemaField[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);

  return headers.map((fieldName) => {
    const values = rows.map((r) => r[fieldName]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '');
    const missingCount = values.length - nonNull.length;

    let inferredType: SchemaField['inferredType'] = 'unknown';
    if (nonNull.length > 0) {
      const sample = nonNull[0];
      if (typeof sample === 'number') {
        inferredType = 'number';
      } else if (typeof sample === 'boolean') {
        inferredType = 'boolean';
      } else if (typeof sample === 'string') {
        // Try to detect dates, numbers, geometry
        if (!isNaN(Date.parse(sample as string)) && (sample as string).includes('-')) {
          inferredType = 'date';
        } else if (!isNaN(Number(sample))) {
          inferredType = 'number';
        } else if (
          (sample as string).toLowerCase().startsWith('point') ||
          (sample as string).toLowerCase().startsWith('linestring') ||
          (sample as string).toLowerCase().startsWith('polygon')
        ) {
          inferredType = 'geometry';
        } else {
          inferredType = 'string';
        }
      }
    }

    const uniqueSet = new Set(nonNull.map((v) => String(v)));

    return {
      name: fieldName,
      inferredType,
      nullable: missingCount > 0,
      uniqueValues: uniqueSet.size,
      missingCount,
      sampleValues: [...uniqueSet].slice(0, 5).map(String),
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER (browser-compatible, no external deps)
// ─────────────────────────────────────────────────────────────────────────────

export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = cols[idx] ?? ''; });
    rows.push(row);
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION CHECKS
// ─────────────────────────────────────────────────────────────────────────────

interface ValidationResult {
  valid: boolean;
  errors: IngestionError[];
  qualityScore: number;
}

const WGS84_LON_RANGE = [-180, 180] as [number, number];
const WGS84_LAT_RANGE = [-90, 90] as [number, number];

function validateCoordinates(
  rows: Record<string, unknown>[],
  lonField: string,
  latField: string
): IngestionError[] {
  const errors: IngestionError[] = [];
  rows.forEach((row, idx) => {
    const lon = Number(row[lonField]);
    const lat = Number(row[latField]);
    if (!isNaN(lon) && (lon < WGS84_LON_RANGE[0] || lon > WGS84_LON_RANGE[1])) {
      errors.push({ rowIndex: idx, field: lonField, value: String(row[lonField]), reason: `Longitude ${lon} outside WGS84 range [-180, 180]`, severity: 'error' });
    }
    if (!isNaN(lat) && (lat < WGS84_LAT_RANGE[0] || lat > WGS84_LAT_RANGE[1])) {
      errors.push({ rowIndex: idx, field: latField, value: String(row[latField]), reason: `Latitude ${lat} outside WGS84 range [-90, 90]`, severity: 'error' });
    }
  });
  return errors;
}

function detectDuplicateIds(
  rows: Record<string, unknown>[],
  idField: string
): IngestionError[] {
  const seen = new Map<string, number>();
  const errors: IngestionError[] = [];
  rows.forEach((row, idx) => {
    const id = String(row[idField] ?? '');
    if (!id) return;
    if (seen.has(id)) {
      errors.push({
        rowIndex: idx,
        field: idField,
        value: id,
        reason: `Duplicate ID "${id}" (first seen at row ${seen.get(id)})`,
        severity: 'error',
      });
    } else {
      seen.set(id, idx);
    }
  });
  return errors;
}

function detectMissingRequired(
  rows: Record<string, unknown>[],
  requiredFields: string[]
): IngestionError[] {
  const errors: IngestionError[] = [];
  rows.forEach((row, idx) => {
    for (const field of requiredFields) {
      const val = row[field];
      if (val === null || val === undefined || val === '') {
        errors.push({
          rowIndex: idx,
          field,
          value: '',
          reason: `Required field "${field}" is missing or empty`,
          severity: 'error',
        });
      }
    }
  });
  return errors;
}

function validateGeoJSON(content: string): IngestionError[] {
  const errors: IngestionError[] = [];
  try {
    const parsed = JSON.parse(content);
    if (!['FeatureCollection', 'Feature', 'GeometryCollection'].includes(parsed?.type)) {
      errors.push({ rowIndex: null, field: 'type', value: parsed?.type, reason: 'Not a valid GeoJSON type (expected FeatureCollection, Feature, or GeometryCollection)', severity: 'error' });
    }
    // Check features have geometry
    if (parsed?.type === 'FeatureCollection') {
      parsed.features?.forEach((f: Record<string, unknown>, idx: number) => {
        if (!f.geometry) {
          errors.push({ rowIndex: idx, field: 'geometry', value: 'null', reason: 'Feature has null geometry', severity: 'warning' });
        }
      });
    }
  } catch (e) {
    errors.push({ rowIndex: null, field: 'JSON', value: '', reason: 'Invalid JSON: ' + String(e), severity: 'error' });
  }
  return errors;
}

function computeQualityScore(
  rows: Record<string, unknown>[],
  errors: IngestionError[],
  schema: SchemaField[]
): number {
  if (rows.length === 0) return 0;
  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warnCount = errors.filter((e) => e.severity === 'warning').length;
  const totalMissing = schema.reduce((s, f) => s + f.missingCount, 0);
  const totalCells = rows.length * schema.length;
  const completeness = totalCells > 0 ? (1 - totalMissing / totalCells) : 1;
  const errorPenalty = Math.min(1, (errorCount * 5 + warnCount * 2) / rows.length);
  return Math.max(0, Math.round((completeness - errorPenalty) * 100));
}

// ─────────────────────────────────────────────────────────────────────────────
// DETECT COORDINATE REFERENCE SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

function detectCRS(rows: Record<string, unknown>[], schema: SchemaField[]): string | undefined {
  const lonFields = schema.filter((f) => /^lo[ng]|longitude$/i.test(f.name) && f.inferredType === 'number');
  const latFields = schema.filter((f) => /^lat|latitude$/i.test(f.name) && f.inferredType === 'number');
  if (lonFields.length > 0 && latFields.length > 0) {
    // Verify sample values are in WGS84 range
    const sampleLon = Number(rows[0]?.[lonFields[0].name]);
    const sampleLat = Number(rows[0]?.[latFields[0].name]);
    if (!isNaN(sampleLon) && !isNaN(sampleLat) &&
      sampleLon >= -180 && sampleLon <= 180 &&
      sampleLat >= -90 && sampleLat <= 90) {
      return 'EPSG:4326 (WGS84, inferred)';
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT TRAIL
// ─────────────────────────────────────────────────────────────────────────────

function auditEntry(message: string): string {
  return `[${new Date().toISOString()}] ${message}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INSPECTION FUNCTION (browser-side, no file system access)
// ─────────────────────────────────────────────────────────────────────────────

export async function inspectFile(
  file: File,
  evidenceClass: ProvenanceType,
  datasetName?: string
): Promise<IngestionJob> {
  const jobId = `job-${Date.now()}`;
  const auditTrail: string[] = [auditEntry(`Job started: ${file.name}`)];

  // File size check
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    return {
      jobId,
      datasetName: datasetName ?? file.name,
      sourceFile: file.name,
      format: detectFormat(file.name),
      zone: 'quarantine',
      status: 'Quarantined',
      evidenceClass,
      licenceStatus: 'PENDING',
      rowsTotal: 0,
      rowsValid: 0,
      rowsQuarantined: 1,
      schema: [],
      errors: [{ rowIndex: null, field: 'file', value: file.name, reason: `File size ${fileSizeMB.toFixed(1)} MB exceeds maximum ${MAX_FILE_SIZE_MB} MB`, severity: 'error' }],
      qualityScore: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      auditTrail: [...auditTrail, auditEntry('QUARANTINED: file too large')],
    };
  }

  // Extension check
  const ext = '.' + (file.name.split('.').pop() ?? '');
  if (!ACCEPTED_EXTENSIONS.includes(ext.toLowerCase())) {
    return {
      jobId,
      datasetName: datasetName ?? file.name,
      sourceFile: file.name,
      format: detectFormat(file.name),
      zone: 'quarantine',
      status: 'Quarantined',
      evidenceClass,
      licenceStatus: 'PENDING',
      rowsTotal: 0,
      rowsValid: 0,
      rowsQuarantined: 1,
      schema: [],
      errors: [{ rowIndex: null, field: 'file', value: file.name, reason: `Unsupported file extension "${ext}". Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`, severity: 'error' }],
      qualityScore: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      auditTrail: [...auditTrail, auditEntry('QUARANTINED: unsupported format')],
    };
  }

  auditTrail.push(auditEntry(`File accepted: ${file.name} (${fileSizeMB.toFixed(2)} MB)`));

  const content = await file.text();
  const format = detectFormat(file.name, content);
  auditTrail.push(auditEntry(`Format detected: ${format}`));

  let rows: Record<string, unknown>[] = [];
  let parseErrors: IngestionError[] = [];

  if (format === 'CSV') {
    rows = parseCSV(content) as Record<string, unknown>[];
    auditTrail.push(auditEntry(`CSV parsed: ${rows.length} rows`));
  } else if (format === 'GeoJSON') {
    parseErrors = validateGeoJSON(content);
    try {
      const parsed = JSON.parse(content);
      rows = (parsed.features ?? []).map((f: Record<string, unknown>) => ({
        ...((f.properties as Record<string, unknown>) ?? {}),
        geometry_type: (f.geometry as Record<string, unknown>)?.type,
      }));
    } catch {}
    auditTrail.push(auditEntry(`GeoJSON parsed: ${rows.length} features`));
  } else if (format === 'JSON') {
    try {
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      parseErrors.push({ rowIndex: null, field: 'JSON', value: '', reason: 'Invalid JSON: ' + String(e), severity: 'error' });
    }
    auditTrail.push(auditEntry(`JSON parsed: ${rows.length} records`));
  } else {
    // XLSX/GPKG: cannot parse in pure browser JS without extra deps
    rows = [];
    parseErrors.push({ rowIndex: null, field: 'format', value: format, reason: `${format} files require server-side parsing. Upload to the API endpoint instead.`, severity: 'warning' });
    auditTrail.push(auditEntry(`${format}: server-side parsing required`));
  }

  // Schema detection
  const schema = detectSchema(rows);
  auditTrail.push(auditEntry(`Schema detected: ${schema.length} fields`));

  // CRS detection
  const crsDetected = detectCRS(rows, schema);
  if (crsDetected) auditTrail.push(auditEntry(`CRS detected: ${crsDetected}`));

  // Validation
  const validationErrors: IngestionError[] = [...parseErrors];

  // Detect ID field
  const idField = schema.find((f) => /^id$|_id$|^uuid/i.test(f.name))?.name;
  if (idField) {
    const dupErrors = detectDuplicateIds(rows, idField);
    validationErrors.push(...dupErrors);
    if (dupErrors.length > 0) auditTrail.push(auditEntry(`Duplicate IDs found: ${dupErrors.length}`));
  }

  // Coordinate validation
  const lonField = schema.find((f) => /^lo[ng]|longitude$/i.test(f.name))?.name;
  const latField = schema.find((f) => /^lat|latitude$/i.test(f.name))?.name;
  if (lonField && latField) {
    const coordErrors = validateCoordinates(rows, lonField, latField);
    validationErrors.push(...coordErrors);
    if (coordErrors.length > 0) auditTrail.push(auditEntry(`Invalid coordinates: ${coordErrors.length}`));
  }

  // Evidence classification warnings
  if (evidenceClass === 'Synthetic') {
    auditTrail.push(auditEntry('SYNTHETIC dataset: must be labelled in all UI outputs'));
  }
  if (evidenceClass === 'Unverified') {
    validationErrors.push({ rowIndex: null, field: 'provenance', value: evidenceClass, reason: 'Dataset marked Unverified. Cannot support factual claims until source is verified.', severity: 'warning' });
  }

  const errorRows = [...new Set(validationErrors.filter((e) => e.severity === 'error').map((e) => e.rowIndex ?? -1))].length;
  const validRows = Math.max(0, rows.length - errorRows);
  const qualityScore = computeQualityScore(rows, validationErrors, schema);

  const hasBlockingErrors = validationErrors.some((e) => e.severity === 'error' && e.rowIndex === null);
  const zone: IngestionZone = hasBlockingErrors
    ? 'quarantine'
    : evidenceClass === 'Synthetic'
    ? 'synthetic'
    : validationErrors.filter((e) => e.severity === 'error').length > rows.length * 0.05
    ? 'quarantine'
    : 'raw';

  const status: IngestionJobStatus = hasBlockingErrors ? 'Quarantined' : 'Validating';

  auditTrail.push(auditEntry(`Quality score: ${qualityScore}/100. Zone: ${zone}. Status: ${status}`));

  return {
    jobId,
    datasetName: datasetName ?? file.name.replace(/\.[^/.]+$/, ''),
    sourceFile: file.name,
    format,
    zone,
    status,
    evidenceClass,
    licenceStatus: 'PENDING',
    rowsTotal: rows.length,
    rowsValid: validRows,
    rowsQuarantined: rows.length - validRows,
    schema,
    errors: validationErrors,
    qualityScore,
    crsDetected,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    auditTrail,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATASET MANIFEST LOADER
// ─────────────────────────────────────────────────────────────────────────────

export function getDatasetManifest(): DatasetManifestEntry[] {
  try {
    return (_manifest.datasets ?? []) as DatasetManifestEntry[];
  } catch {
    return [];
  }
}

export function getManifestStats() {
  const entries: DatasetManifestEntry[] = getDatasetManifest();
  return {
    total: entries.length,
    readyCount: entries.filter((e) => e.status === 'Ready').length,
    pendingLicence: entries.filter((e) => e.status === 'Pending_Licence').length,
    syntheticCount: entries.filter((e) => e.evidenceClass === 'SYNTHETIC').length,
    observedCount: entries.filter((e) => e.evidenceClass === 'OBSERVED_SOURCE').length,
    derivedCount: entries.filter((e) => e.evidenceClass === 'DERIVED').length,
    assumptionCount: entries.filter((e) => e.evidenceClass === 'ASSUMPTION').length,
  };
}
