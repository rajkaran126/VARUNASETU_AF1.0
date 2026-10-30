/**
 * VARUNASETU — Hybrid RAG & Evidence Grounding Engine
 *
 * Implements:
 * - Multi-source retrieval: Cables, Landing Stations, SRLGs, Repair Fleet, Simulation State
 * - Exact identifier matching + metadata filtering + keyword ranking
 * - Evidence citations with provenance tags (Tier 1 Observed, Tier 2 Derived, Tier 3 Synthetic)
 * - Anti-hallucination context assembly for specialist agents and Ghost Copilot
 */

import { ALL_CABLE_ROUTES, ALL_FAULT_INCIDENTS } from '@/lib/cable-registry';
import { REPAIR_FLEET, DETERMINED_REROUTE_PLANS } from '@/lib/cable-data';
import { ResolvedEntity } from './nlp-engine';
import { SimulationResult } from '@/lib/types';

export interface EvidenceRecord {
  id: string; // e.g. [CBL:smw4], [SRLG:red-sea], [VESSEL:sov-01]
  category: 'cable' | 'landing_station' | 'srlg' | 'vessel' | 'incident' | 'reroute_plan' | 'simulation_metric';
  title: string;
  provenance: 'Observed (Tier 1)' | 'Derived (Tier 2)' | 'Synthetic (Tier 3)';
  content: string;
  metadata: Record<string, unknown>;
  relevanceScore: number;
}

export interface AssembledRAGContext {
  query: string;
  evidence: EvidenceRecord[];
  formattedContext: string;
  citationsList: { id: string; title: string; provenance: string }[];
}

export class RAGService {
  /**
   * Retrieves relevant evidence records based on NLP entities and query keywords
   */
  public retrieveEvidence(
    query: string,
    entities: ResolvedEntity[],
    activeSimulation?: SimulationResult
  ): EvidenceRecord[] {
    const records: EvidenceRecord[] = [];
    const lowerQuery = query.toLowerCase();

    // 1. Retrieve by Resolved Entities
    for (const entity of entities) {
      if (entity.type === 'cable') {
        const cable = ALL_CABLE_ROUTES.find(c => c.id === entity.canonicalId);
        if (cable) {
          records.push({
            id: `[CBL:${cable.id}]`,
            category: 'cable',
            title: cable.name,
            provenance: 'Observed (Tier 1)',
            content: `Subsea Cable ${cable.name} (${cable.id}). Length: ${cable.lengthKm}km. Lit Capacity: ${cable.litCapacityTbps} Tbps. Operational Status: ${cable.status}. Region: ${cable.region}. Landings: ${cable.landingStations?.map(s => `${s.name} (${s.country})`).join(', ') || 'N/A'}.`,
            metadata: {
              status: cable.status,
              owners: cable.owners,
              fiberPairs: cable.fiberPairs,
            },
            relevanceScore: 1.0,
          });
        }
      } else if (entity.type === 'vessel') {
        const vessel = REPAIR_FLEET.find(v => v.id === entity.canonicalId || v.name === entity.canonicalName);
        if (vessel) {
          records.push({
            id: `[FLEET:${vessel.id}]`,
            category: 'vessel',
            title: vessel.name,
            provenance: 'Synthetic (Tier 3)',
            content: `Repair Vessel ${vessel.name} (${vessel.dpRating}). Current Base: ${vessel.currentPort}. Speed: ${vessel.cruisingSpeedKnots} knots. Max Benthic ROV Depth: ${vessel.rovDepthRatingM}m. Status: ${vessel.status}. Tank Capacity: ${vessel.cableTankCapacityTonnes} tonnes.`,
            metadata: {
              currentPort: vessel.currentPort,
              dpRating: vessel.dpRating,
            },
            relevanceScore: 0.95,
          });
        }
      } else if (entity.type === 'srlg_chokepoint') {
        records.push({
          id: `[SRLG:${entity.canonicalId}]`,
          category: 'srlg',
          title: entity.canonicalName,
          provenance: 'Derived (Tier 2)',
          content: `Shared Risk Link Group: ${entity.canonicalName}. High physical vulnerability corridor where multiple subsea trunks converge within a narrow trench or common landing station. Correlated failure probability: High (>85%).`,
          metadata: {
            chokepointId: entity.canonicalId,
          },
          relevanceScore: 0.98,
        });
      }
    }

    // 2. Retrieve SRLG / False Redundancy Knowledge if query implies redundancy
    if (lowerQuery.includes('redundant') || lowerQuery.includes('redundancy') || lowerQuery.includes('srlg') || lowerQuery.includes('false')) {
      records.push({
        id: `[SRLG:chokepoints-registry]`,
        category: 'srlg',
        title: 'Global Subsea Chokepoint SRLG Registry',
        provenance: 'Derived (Tier 2)',
        content: `Documented SRLGs: 1) Egypt/Suez Corridor (SMW4, SMW5, AAE-1 converge across 38km land transit), 2) Bab el-Mandeb (water depth -4,120m, 16 cables in 26km strait), 3) Strait of Malacca (shallow waters <100m, high anchor drag risk), 4) Luzon Strait (seismic subsea fault trench).`,
        metadata: { documentedCount: 4 },
        relevanceScore: 0.92,
      });
    }

    // 3. Retrieve Active Fault & Incidents Knowledge
    for (const incident of ALL_FAULT_INCIDENTS.slice(0, 5)) {
      if (lowerQuery.includes(incident.cableName.toLowerCase()) || lowerQuery.includes('incident') || lowerQuery.includes('fault')) {
        records.push({
          id: `[INC:${incident.id}]`,
          category: 'incident',
          title: `Incident: ${incident.cableName}`,
          provenance: incident.provenance === 'Observed' ? 'Observed (Tier 1)' : 'Derived (Tier 2)',
          content: `Fault Record on ${incident.cableName}: Type: ${incident.faultType}. Location: ${incident.nearestLandingStation} (-${incident.depthMeters}m). Optical Loss: ${incident.opticalLossDb} dB. Affected Traffic: ${incident.affectedTrafficTbps} Tbps. Status: ${incident.status}.`,
          metadata: {
            severity: incident.severity,
            depthMeters: incident.depthMeters,
          },
          relevanceScore: 0.88,
        });
      }
    }

    // 4. Retrieve Reroute Bypass Plans
    if (lowerQuery.includes('reroute') || lowerQuery.includes('bypass') || lowerQuery.includes('headroom') || lowerQuery.includes('traffic')) {
      for (const plan of DETERMINED_REROUTE_PLANS) {
        records.push({
          id: `[REROUTE:${plan.id}]`,
          category: 'reroute_plan',
          title: plan.title,
          provenance: 'Derived (Tier 2)',
          content: `Bypass Corridor: ${plan.bypassCorridorName}. Restored Capacity: ${plan.restoredCapacityTbps} Tbps (${plan.restoredCapacityPct}%). Latency Penalty: +${plan.latencyPenaltyMs}ms. Transit Waypoints: ${plan.waypoints.map(w => w.name).join(' -> ')}. Target Cable: ${plan.targetCableId}.`,
          metadata: {
            penaltyMs: plan.latencyPenaltyMs,
            targetCableId: plan.targetCableId,
          },
          relevanceScore: 0.85,
        });
      }
    }

    // 5. Retrieve Active Simulation Metrics
    if (activeSimulation) {
      records.push({
        id: `[SIM:active-run]`,
        category: 'simulation_metric',
        title: `Active Digital Twin Simulation (Engine ${activeSimulation.engineVersion})`,
        provenance: 'Derived (Tier 2)',
        content: `Total Offered Demand: ${activeSimulation.totalOfferedDemandTbps} Tbps. Served Demand: ${activeSimulation.servedDemandTbps} Tbps. Unserved Demand: ${activeSimulation.unservedDemandTbps} Tbps. Baseline Latency: ${activeSimulation.baselineLatencyMs}ms. Impacted Latency: ${activeSimulation.impactedLatencyMs}ms (Delta: +${activeSimulation.latencyDeltaMs}ms). Capacity Resilience: ${activeSimulation.capacityUtilizationPct}%. Affected Alternate Routes: ${activeSimulation.affectedRoutes.map(r => `${r.routeName} (${r.postFailureLoadPct}% load)`).join('; ')}.`,
        metadata: {
          seed: activeSimulation.randomSeed,
          utilization: activeSimulation.capacityUtilizationPct,
        },
        relevanceScore: 0.99,
      });
    }

    // De-duplicate by ID and sort by relevance
    const seen = new Set<string>();
    const unique = records.filter(r => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });

    return unique.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Formats retrieved records into strict grounded markdown with evidence citations
   */
  public assembleRAGContext(
    query: string,
    evidence: EvidenceRecord[]
  ): AssembledRAGContext {
    let formattedContext = '### VERIFIED GROUND TRUTH EVIDENCE:\n';

    for (const record of evidence) {
      formattedContext += `\n- **${record.id}** (${record.provenance}): ${record.content}`;
    }

    formattedContext += `\n\n### MANDATORY GROUNDING RULE:\nEvery statement and quantitative metric in your response MUST be directly supported by and cite one or more evidence IDs (e.g. [CBL:smw4] or [SIM:active-run]). Never extrapolate, guess, or invent unlisted metrics.`;

    const citationsList = evidence.map(e => ({
      id: e.id,
      title: e.title,
      provenance: e.provenance,
    }));

    return {
      query,
      evidence,
      formattedContext,
      citationsList,
    };
  }
}

export const ragService = new RAGService();
