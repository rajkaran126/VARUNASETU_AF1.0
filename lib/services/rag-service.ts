/**
 * VARUNASETU — Hybrid RAG & Evidence Grounding Engine
 *
 * Implements:
 * - Multi-source retrieval across all 34 master datasets via DatasetKnowledgeService
 * - Exact identifier matching + metadata filtering + keyword ranking
 * - Grounded evidence citations with strict 5-tier provenance tags:
 *   OBSERVED_SOURCE, DERIVED, SYNTHETIC, ASSUMPTION, UNVERIFIED
 * - Anti-hallucination context assembly for specialist agents and Ghost Copilot
 */

import { ALL_CABLE_ROUTES, ALL_FAULT_INCIDENTS } from '@/lib/cable-registry';
import { REPAIR_FLEET, DETERMINED_REROUTE_PLANS } from '@/lib/cable-data';
import { ResolvedEntity } from './nlp-engine';
import { SimulationResult } from '@/lib/types';
import { datasetKnowledgeService, ProvenanceClass } from './dataset-knowledge.service';

export interface EvidenceRecord {
  id: string; // e.g. [CBL:smw4], [SRLG:suez-canal], [VESSEL:sov-01]
  category: 'cable' | 'landing_station' | 'srlg' | 'vessel' | 'incident' | 'reroute_plan' | 'simulation_metric' | 'weather' | 'telemetry';
  title: string;
  provenance: ProvenanceClass | 'Observed (Tier 1)' | 'Derived (Tier 2)' | 'Synthetic (Tier 3)';
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

    // 1. Query Master Datasets via DatasetKnowledgeService
    const canonicalEntities = entities.map(e => e.canonicalId);
    const datasetItems = datasetKnowledgeService.queryKnowledge(query, canonicalEntities);
    for (const item of datasetItems) {
      records.push({
        id: item.id,
        category: item.category as any,
        title: item.title,
        provenance: item.provenance,
        content: item.content,
        metadata: item.attributes,
        relevanceScore: item.relevanceScore,
      });
    }

    // 2. Retrieve by Resolved Entities from active registry
    for (const entity of entities) {
      if (entity.type === 'cable') {
        const cable = ALL_CABLE_ROUTES.find(c => c.id === entity.canonicalId);
        if (cable && !records.some(r => r.id === `[CBL:${cable.id}]`)) {
          records.push({
            id: `[CBL:${cable.id}]`,
            category: 'cable',
            title: cable.name,
            provenance: 'OBSERVED_SOURCE',
            content: `Subsea Cable ${cable.name} (${cable.id}). Length: ${cable.lengthKm}km. Lit Capacity: ${cable.litCapacityTbps} Tbps. Operational Status: ${cable.status}. Region: ${cable.region}. Landings: ${cable.landingStations?.map(s => `${s.name} (${s.country})`).join(', ') || 'N/A'}.`,
            metadata: {
              status: cable.status,
              owners: cable.owners,
              fiberPairs: cable.fiberPairs,
            },
            relevanceScore: 0.95,
          });
        }
      } else if (entity.type === 'srlg_chokepoint') {
        if (!records.some(r => r.id === `[SRLG:${entity.canonicalId}]`)) {
          records.push({
            id: `[SRLG:${entity.canonicalId}]`,
            category: 'srlg',
            title: entity.canonicalName,
            provenance: 'DERIVED',
            content: `Shared Risk Link Group (SRLG) ${entity.canonicalName}. Co-located maritime/terrestrial corridor where physical severance creates correlated multi-carrier failures.`,
            metadata: { canonicalId: entity.canonicalId },
            relevanceScore: 0.96,
          });
        }
      }
    }

    // 3. Fallback General SRLG Evidence if redundancy/chokepoint query
    if (
      records.every(r => r.category !== 'srlg') &&
      (lowerQuery.includes('redundant') || lowerQuery.includes('srlg') || lowerQuery.includes('chokepoint') || lowerQuery.includes('egypt'))
    ) {
      records.push({
        id: '[SRLG:chokepoints-registry]',
        category: 'srlg',
        title: 'Canonical Chokepoint & Shared Trench Registry',
        provenance: 'DERIVED',
        content: 'Identified Shared Risk Link Groups (SRLG): Suez Canal & Egypt terrestrial ducts (cables: smw4, smw5, aae-1, 2africa, flag-feea); Bab el-Mandeb (smw4, smw5, aae-1, peace-cable); Strait of Malacca (smw4, smw5, tiger-cable, bay-to-bay); Luzon Strait Seismic Fault (apcn-2, c2c, sjc, tpe).',
        metadata: { source: 'Phase 4A SRLG Engine' },
        relevanceScore: 0.91,
      });
    }

    // 4. Retrieve Active Reroute Plans
    if (
      lowerQuery.includes('reroute') ||
      lowerQuery.includes('bypass') ||
      lowerQuery.includes('alternative') ||
      lowerQuery.includes('capacity')
    ) {
      for (const plan of DETERMINED_REROUTE_PLANS) {
        records.push({
          id: `[PLAN:${plan.id}]`,
          category: 'reroute_plan',
          title: plan.title,
          provenance: 'DERIVED',
          content: `Reroute Plan: ${plan.title}. Target Cable: ${plan.targetCableId}. Restored Capacity: ${plan.restoredCapacityTbps} Tbps (${plan.restoredCapacityPct}%). Latency Penalty: +${plan.latencyPenaltyMs}ms. Transit Waypoints: ${plan.waypoints.map(w => w.name).join(' -> ')}. Note: ${plan.notes}`,
          metadata: {
            planId: plan.id,
            restoredPct: plan.restoredCapacityPct,
            latencyPenaltyMs: plan.latencyPenaltyMs,
          },
          relevanceScore: 0.88,
        });
      }
    }

    // 5. Active Simulation Telemetry if present
    if (activeSimulation) {
      records.push({
        id: '[SIM:active-run]',
        category: 'simulation_metric',
        title: 'Active Deterministic Simulation Kernel State',
        provenance: 'DERIVED',
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
    let formattedContext = '### VERIFIED GROUND TRUTH EVIDENCE (from 34 Canonical Master Datasets):\n';

    for (const record of evidence) {
      formattedContext += `\n- **${record.id}** [${record.provenance}]: ${record.content}`;
    }

    formattedContext += `\n\n### MANDATORY GROUNDING RULE:\nEvery statement and quantitative metric in your response MUST be directly supported by and cite one or more evidence IDs (e.g. [CBL:smw4], [SRLG:egypt-transit-ducts], or [SIM:active-run]). State data provenance explicitly. Never extrapolate, guess, or invent unlisted metrics.`;

    const citationsList = evidence.map(e => ({
      id: e.id,
      title: e.title,
      provenance: typeof e.provenance === 'string' ? e.provenance : 'OBSERVED_SOURCE',
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
