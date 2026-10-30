/**
 * VARUNASETU — Advanced NLP & NLU Engine
 *
 * Implements:
 * - Intent Classification across 18 canonical telecom/resilience categories
 * - Domain Named Entity Recognition (NER) for cables, landing stations, regions, vessels, SRLGs
 * - Authoritative Entity Resolution against the canonical 692-cable registry
 * - Multi-turn conversational reference resolution ("it", "these two cables", "that chokepoint")
 * - Execution action planning with safety approval gates
 */

import { groqKeyManager } from './groq-key-manager';
import { ALL_CABLE_ROUTES } from '@/lib/cable-registry';
import { REPAIR_FLEET } from '@/lib/cable-data';

export type CanonicalIntent =
  | 'NETWORK_LOOKUP'
  | 'CABLE_STATUS'
  | 'LANDING_STATION_LOOKUP'
  | 'CABLE_CONNECTIVITY'
  | 'REDUNDANCY_ANALYSIS'
  | 'SRLG_ANALYSIS'
  | 'FAILURE_IMPACT_ANALYSIS'
  | 'CORRELATED_FAILURE_ANALYSIS'
  | 'SCENARIO_CREATION'
  | 'SIMULATION_EXECUTION'
  | 'TRAFFIC_REROUTING_ANALYSIS'
  | 'CONGESTION_ANALYSIS'
  | 'REPAIR_PLANNING'
  | 'VESSEL_LOOKUP'
  | 'RECOVERY_COMPARISON'
  | 'REPORT_GENERATION'
  | 'DATA_QUALITY_QUERY'
  | 'GENERAL_EXPLANATION';

export interface ResolvedEntity {
  type: 'cable' | 'landing_station' | 'region' | 'vessel' | 'srlg_chokepoint' | 'metric';
  rawMention: string;
  canonicalId: string;
  canonicalName: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface NLPAnalysisResult {
  query: string;
  primaryIntent: CanonicalIntent;
  confidence: number;
  entities: ResolvedEntity[];
  requiresSpecialists: ('orchestrator' | 'network' | 'risk' | 'logistics' | 'policy')[];
  suggestedAction?: {
    actionType: 'SIMULATE' | 'REROUTE' | 'DISPATCH' | 'ANALYZE_SRLG' | 'GENERATE_REPORT' | 'NAVIGATE';
    targetRoute?: string;
    payload?: Record<string, unknown>;
    requiresConfirmation: boolean;
  };
  clarificationNeeded?: string;
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  contextEntities?: ResolvedEntity[];
}

export class NLPEngine {
  /**
   * Fast rule-based / regex resolution before LLM triage
   */
  public resolveEntitiesLocally(text: string): ResolvedEntity[] {
    const resolved: ResolvedEntity[] = [];
    const lower = text.toLowerCase();

    // 1. Cables lookup (692 cables)
    for (const cable of ALL_CABLE_ROUTES) {
      const cId = cable.id.toLowerCase();
      const cName = cable.name.toLowerCase();

      // Check common shorthands e.g. SMW4 for SEA-ME-WE 4
      const shorthandMatch =
        (cId === 'smw4' && (lower.includes('smw4') || lower.includes('smw-4') || lower.includes('sea-me-we 4'))) ||
        (cId === 'smw5' && (lower.includes('smw5') || lower.includes('smw-5') || lower.includes('sea-me-we 5'))) ||
        (cId === 'aae1' && (lower.includes('aae1') || lower.includes('aae-1'))) ||
        (cId === 'marea' && lower.includes('marea')) ||
        (cId === 'faster' && lower.includes('faster')) ||
        (cId === 'apcn2' && (lower.includes('apcn2') || lower.includes('apcn-2'))) ||
        (cId === '2africa' && (lower.includes('2africa') || lower.includes('2 africa'))) ||
        lower.includes(cName) ||
        (cId.length > 3 && lower.includes(cId));

      if (shorthandMatch) {
        resolved.push({
          type: 'cable',
          rawMention: cable.name,
          canonicalId: cable.id,
          canonicalName: cable.name,
          confidence: 0.98,
          metadata: {
            status: cable.status,
            lengthKm: cable.lengthKm,
            litCapacityTbps: cable.litCapacityTbps,
            region: cable.region,
          },
        });
      }
    }

    // 2. Chokepoints / SRLG lookup
    const chokepoints = [
      { id: 'srlg-bab-el-mandeb', name: 'Bab el-Mandeb Chokepoint', terms: ['bab el-mandeb', 'bab-el-mandeb', 'red sea chokepoint'] },
      { id: 'srlg-suez-canal', name: 'Suez Canal Subsea Trench', terms: ['suez', 'zafarana', 'abu talat'] },
      { id: 'srlg-strait-of-malacca', name: 'Strait of Malacca', terms: ['malacca', 'singapore strait'] },
      { id: 'srlg-luzon-strait', name: 'Luzon Strait Benthic Fault', terms: ['luzon', 'bashi channel', 'taiwan strait'] },
      { id: 'srlg-strait-of-gibraltar', name: 'Strait of Gibraltar', terms: ['gibraltar'] },
    ];

    for (const cp of chokepoints) {
      if (cp.terms.some(t => lower.includes(t))) {
        resolved.push({
          type: 'srlg_chokepoint',
          rawMention: cp.name,
          canonicalId: cp.id,
          canonicalName: cp.name,
          confidence: 0.95,
        });
      }
    }

    // 3. Repair Fleet lookup
    for (const vessel of REPAIR_FLEET) {
      if (lower.includes(vessel.name.toLowerCase()) || lower.includes(vessel.id.toLowerCase())) {
        resolved.push({
          type: 'vessel',
          rawMention: vessel.name,
          canonicalId: vessel.id,
          canonicalName: vessel.name,
          confidence: 0.99,
          metadata: {
            port: vessel.currentPort,
            speedKnots: vessel.cruisingSpeedKnots,
            rovDepthRatingM: vessel.rovDepthRatingM,
          },
        });
      }
    }

    return resolved;
  }

  /**
   * Complete NLP Pipeline: Intent Classification + Contextual NER + Action Mapping
   */
  public async analyzeQuery(
    query: string,
    history: ConversationTurn[] = []
  ): Promise<NLPAnalysisResult> {
    const localEntities = this.resolveEntitiesLocally(query);

    // Multi-turn context resolution: if user says "it", "both", "that cable", pull from last turn
    const contextEntities: ResolvedEntity[] = [];
    if (localEntities.length === 0 && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].contextEntities && history[i].contextEntities!.length > 0) {
          contextEntities.push(...history[i].contextEntities!);
          break;
        }
      }
    }

    const mergedEntities = [...localEntities, ...contextEntities];

    // High-speed LLM Intent Classification via Groq Qwen 27B
    const systemPrompt = `You are the VARUNASETU NLP & NLU Intelligence Core for a submarine telecom digital twin.
Classify the user prompt into one of these canonical intents:
- NETWORK_LOOKUP, CABLE_STATUS, LANDING_STATION_LOOKUP, CABLE_CONNECTIVITY
- REDUNDANCY_ANALYSIS, SRLG_ANALYSIS, FAILURE_IMPACT_ANALYSIS, CORRELATED_FAILURE_ANALYSIS
- SCENARIO_CREATION, SIMULATION_EXECUTION, TRAFFIC_REROUTING_ANALYSIS, CONGESTION_ANALYSIS
- REPAIR_PLANNING, VESSEL_LOOKUP, RECOVERY_COMPARISON, REPORT_GENERATION, DATA_QUALITY_QUERY, GENERAL_EXPLANATION

Required specialist agents to involve:
- 'network' (topology, graph paths, SRLG, redundancy)
- 'risk' (correlated breaks, blast radius, cascade scenarios)
- 'logistics' (vessels, ROV repair, weather, transit)
- 'policy' (traffic reroute, congestion, QoS priority P1-P4)
- 'orchestrator' (always included)

Output valid JSON only matching this schema:
{
  "primaryIntent": "CANONICAL_INTENT",
  "confidence": 0.0 to 1.0,
  "requiresSpecialists": ["orchestrator", "network", ...],
  "suggestedAction": {
    "actionType": "SIMULATE" | "REROUTE" | "DISPATCH" | "ANALYZE_SRLG" | "GENERATE_REPORT" | "NAVIGATE",
    "targetRoute": "optional route string",
    "requiresConfirmation": boolean
  },
  "clarificationNeeded": "optional question if query is totally ambiguous, else null"
}`;

    const userPrompt = `Query: "${query}"
Previously active entities in conversation: ${JSON.stringify(contextEntities.map(e => `${e.type}:${e.canonicalName}`))}
Directly resolved entities: ${JSON.stringify(localEntities.map(e => `${e.type}:${e.canonicalName}`))}`;

    try {
      const response = await groqKeyManager.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 350,
        }
      );

      const parsed = JSON.parse(response.content);

      return {
        query,
        primaryIntent: parsed.primaryIntent || 'GENERAL_EXPLANATION',
        confidence: parsed.confidence || 0.9,
        entities: mergedEntities,
        requiresSpecialists: Array.isArray(parsed.requiresSpecialists)
          ? parsed.requiresSpecialists
          : ['orchestrator', 'network'],
        suggestedAction: parsed.suggestedAction || undefined,
        clarificationNeeded: parsed.clarificationNeeded || undefined,
      };
    } catch (err) {
      console.warn('[NLPEngine] LLM classification fallback to rule-based parser:', err);
      // Deterministic rule-based fallback if LLM is unavailable
      return this.ruleBasedFallback(query, mergedEntities);
    }
  }

  private ruleBasedFallback(query: string, entities: ResolvedEntity[]): NLPAnalysisResult {
    const lower = query.toLowerCase();
    let intent: CanonicalIntent = 'GENERAL_EXPLANATION';
    const specialists: ('orchestrator' | 'network' | 'risk' | 'logistics' | 'policy')[] = ['orchestrator'];

    if (lower.includes('redundant') || lower.includes('redundancy') || lower.includes('srlg') || lower.includes('shared')) {
      intent = 'REDUNDANCY_ANALYSIS';
      specialists.push('network', 'risk');
    } else if (lower.includes('fail') || lower.includes('break') || lower.includes('sever') || lower.includes('rupture')) {
      intent = 'FAILURE_IMPACT_ANALYSIS';
      specialists.push('risk', 'network');
    } else if (lower.includes('vessel') || lower.includes('ship') || lower.includes('repair') || lower.includes('rov')) {
      intent = 'REPAIR_PLANNING';
      specialists.push('logistics');
    } else if (lower.includes('reroute') || lower.includes('traffic') || lower.includes('congestion') || lower.includes('capacity')) {
      intent = 'TRAFFIC_REROUTING_ANALYSIS';
      specialists.push('policy', 'network');
    } else if (lower.includes('report') || lower.includes('pdf') || lower.includes('export')) {
      intent = 'REPORT_GENERATION';
    } else {
      intent = 'NETWORK_LOOKUP';
      specialists.push('network');
    }

    return {
      query,
      primaryIntent: intent,
      confidence: 0.85,
      entities,
      requiresSpecialists: specialists,
    };
  }
}

export const nlpEngine = new NLPEngine();
