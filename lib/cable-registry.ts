/**
 * VARUNASETU — Canonical Cable & Incident Registry
 * Pure data module safe for both server-side API routes and client components.
 */

import { CableRoute, FaultIncident } from './types';
import { VERIFIED_CABLE_ROUTES, ACTIVE_FAULT_INCIDENTS } from './cable-data';
import { REAL_CABLE_ROUTES, REAL_FAULT_INCIDENTS } from './cable-data-real';

// Merge: real registry (692) + curated simulation cables (10).
// Dedup by id — VERIFIED_CABLE_ROUTES take precedence for simulation fidelity.
const REAL_ID_SET = new Set(REAL_CABLE_ROUTES.map(c => c.id));
const CURATED_ONLY = VERIFIED_CABLE_ROUTES.filter(c => !REAL_ID_SET.has(c.id));

export const ALL_CABLE_ROUTES: CableRoute[] = [...REAL_CABLE_ROUTES, ...CURATED_ONLY];

// Real incidents + simulation incidents merged (real first)
export const ALL_FAULT_INCIDENTS: FaultIncident[] = [...REAL_FAULT_INCIDENTS, ...ACTIVE_FAULT_INCIDENTS];
