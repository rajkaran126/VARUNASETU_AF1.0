/**
 * VARUNASETU — Advanced Multilingual NLP & NLU Engine
 *
 * Implements:
 * - 19 Canonical Intent Categories (including CASUAL_CONVERSATION)
 * - Multilingual Language & Script Detection (English, Kannada, Hindi, Code-Switching)
 * - Romanized Transliteration Normalization (e.g., "Ee cable break aadre...")
 * - Authoritative Entity Resolution against the 692-cable registry
 * - Multi-turn conversational context reference resolution
 * - Safety-gated action planning for digital twin simulations
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
  | 'GENERAL_EXPLANATION'
  | 'CASUAL_CONVERSATION';

export type EmotionalTone =
  | 'panicked_urgent'
  | 'frustrated_stressed'
  | 'casual_friendly'
  | 'appreciative_warm'
  | 'executive_terse'
  | 'curious_exploratory'
  | 'professional_technical';

export interface ResolvedEntity {
  type: 'cable' | 'landing_station' | 'region' | 'vessel' | 'srlg_chokepoint' | 'metric';
  rawMention: string;
  canonicalId: string;
  canonicalName: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface LanguageMetadata {
  detectedLanguage: 'english' | 'kannada' | 'hindi' | 'mixed_indic' | 'other';
  detectedScript: 'latin' | 'kannada' | 'devanagari' | 'mixed';
  isTransliterated: boolean;
  confidence: number;
}

export interface NLPAnalysisResult {
  query: string;
  primaryIntent: CanonicalIntent;
  confidence: number;
  entities: ResolvedEntity[];
  language: LanguageMetadata;
  emotionalTone: EmotionalTone;
  toneConfidence: number;
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
   * Multilingual Language & Script Detection
   */
  public detectLanguageAndScript(text: string): LanguageMetadata {
    const hasKannadaScript = /[\u0C80-\u0CFF]/.test(text);
    const hasDevanagari = /[\u0900-\u097F]/.test(text);

    if (hasKannadaScript) {
      return {
        detectedLanguage: 'kannada',
        detectedScript: 'kannada',
        isTransliterated: false,
        confidence: 0.98,
      };
    }

    if (hasDevanagari) {
      return {
        detectedLanguage: 'hindi',
        detectedScript: 'devanagari',
        isTransliterated: false,
        confidence: 0.98,
      };
    }

    // Romanized / Transliteration Pattern Checks
    const lower = text.toLowerCase();
    const kannadaKeywords = ['namaskara', 'namaskaram', 'hegiddira', 'neevu', 'ee', 'aadre', 'yaavudu', 'enu', 'alli', 'agutte', 'nalli', 'mathu', 'idu', 'beku', 'maduthare', 'olleyadu', 'hege', 'hadagu', 'tundu'];
    const hindiKeywords = ['namaste', 'namaskar', 'kya', 'aur', 'mein', 'me', 'hain', 'hoga', 'kaunsa', 'kaise', 'agar', 'toot', 'gaya', 'karega', 'achha', 'jahaj', 'batao'];

    const kannadaMatches = kannadaKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(lower)).length;
    const hindiMatches = hindiKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(lower)).length;

    if (kannadaMatches >= 2 || (kannadaMatches >= 1 && (lower.includes('cable') || lower.includes('smw') || lower.includes('namaskara') || lower.includes('varunasetu')))) {
      return {
        detectedLanguage: 'kannada',
        detectedScript: 'latin',
        isTransliterated: true,
        confidence: 0.95,
      };
    }

    if (hindiMatches >= 2 || (hindiMatches >= 1 && (lower.includes('cable') || lower.includes('redundant') || lower.includes('namaste') || lower.includes('varunasetu')))) {
      return {
        detectedLanguage: 'hindi',
        detectedScript: 'latin',
        isTransliterated: true,
        confidence: 0.95,
      };
    }

    return {
      detectedLanguage: 'english',
      detectedScript: 'latin',
      isTransliterated: false,
      confidence: 0.95,
    };
  }

  /**
   * Helper to strip technical context prefixes e.g. "[Context: Active cable ...]: user message"
   */
  public cleanText(text: string): string {
    return text.replace(/^\[Context:[^\]]*\]:\s*/i, '').trim();
  }

  /**
   * Emotional Intelligence & Communication Tone Attunement
   */
  public detectEmotionalTone(rawText: string): { emotionalTone: EmotionalTone; toneConfidence: number } {
    const text = this.cleanText(rawText);
    const lower = text.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(Boolean);

    // 1. Appreciative / Warm (Check first so "thanks for the help!" isn't marked as panic)
    const appreciationTriggers = [
      'thanks', 'thank you', 'awesome', 'great work', 'nice job', 'appreciate',
      'good job', 'dhanyavaada', 'shukriya', 'shabaash', 'superb', 'love it',
      'brilliant', 'wonderful', 'kudos', 'well done', 'thank u', 'much obliged',
      'legend', 'goat', 'sweet', 'clutch', 'impressive', 'good bot', 'best ai'
    ];
    if (appreciationTriggers.some(t => new RegExp(`\\b${t}\\b`, 'i').test(lower))) {
      return { emotionalTone: 'appreciative_warm', toneConfidence: 0.96 };
    }

    // 2. Frustrated / Stressed / Demanding Improvement
    const frustrationTriggers = [
      'not responding', 'fix this', 'broken', 'wrong', 'annoying', 'why is this', 'stuck',
      'failed again', 'terrible', 'ugh', 'hate', 'irritated', 'again', 'not working',
      'useless', 'slow', 'headache', 'fed up', 'stress', 'emotional', 'emotionally',
      'be human', 'reply like', 'robot', 'robotic', 'stiff', 'dry', 'answer properly',
      'listen to me', 'cmon', 'come on', 'why wont you', 'doesnt work', "doesn't work"
    ];
    if (frustrationTriggers.some(t => lower.includes(t))) {
      return { emotionalTone: 'frustrated_stressed', toneConfidence: 0.95 };
    }

    // 3. Panicked / Urgent
    const panicTriggers = [
      'emergency', 'critical', 'broken cable', 'help me', 'please help', 'omg', 'panicking', 'shut down',
      'collapse', 'asap', 'hurry', 'alert', 'crisis', 'disaster', 'failing',
      'saving', 'terrified', 'kya hoga', 'chinthe', 'bhaya', 'what happened', 'cable break'
    ];
    const hasExclamations = (text.match(/!{2,}/g) || []).length > 0;
    const hasAllCaps = text.length > 5 && text === text.toUpperCase() && /[A-Z]/.test(text);
    const panicHits = panicTriggers.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(lower)).length;

    if (hasExclamations || hasAllCaps || panicHits >= 2 || (panicHits >= 1 && (lower.includes('!') || lower.includes('please') || lower.includes('now') || lower.includes('quick')))) {
      return { emotionalTone: 'panicked_urgent', toneConfidence: 0.95 };
    }

    // 4. Casual / Friendly / Bro / Friend
    const casualTriggers = [
      'hey', 'hi', 'hello', 'sup', 'buddy', 'dude', 'bro', 'man', 'pal', 'mate', 'yo',
      'friend', 'like a friend', 'macha', 'bhai', 'yaar', 'dost', 'chill', 'homie',
      'how are you', 'whats up', 'whatsup', 'wassup', 'how is it going', 'how are things',
      'good morning', 'good afternoon', 'cool', 'haha', 'lol', 'cheers', 'namaskara', 'namaste',
      'hegiddira', 'kaise ho', 'bol bhai', 'kya haal', 'sun yaar', 'talk to me', 'who are you', 'tell me',
      'formal', 'colleague', 'too formal', 'stop being formal', 'talk normally', 'be real'
    ];
    if (casualTriggers.some(t => new RegExp(`(^|\\b)${t}(\\b|$)`, 'i').test(lower))) {
      return { emotionalTone: 'casual_friendly', toneConfidence: 0.95 };
    }

    // 5. Executive / Terse (rapid-fire, concise query under 5 words)
    if (words.length <= 5 && (lower.endsWith('?') || lower.startsWith('status') || lower.startsWith('loss') || lower.startsWith('eta') || lower.startsWith('capacity'))) {
      return { emotionalTone: 'executive_terse', toneConfidence: 0.88 };
    }

    // 6. Curious / Exploratory
    const curiousTriggers = ['explain', 'why', 'how does', 'tell me about', 'what is the difference', 'can you show me', 'history', 'walk me through'];
    if (curiousTriggers.some(t => lower.includes(t))) {
      return { emotionalTone: 'curious_exploratory', toneConfidence: 0.89 };
    }

    return { emotionalTone: 'professional_technical', toneConfidence: 0.85 };
  }

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
        (cId === 'smw4' && (lower.includes('smw4') || lower.includes('smw-4') || lower.includes('sea-me-we 4') || lower.includes('smw 4'))) ||
        (cId === 'smw5' && (lower.includes('smw5') || lower.includes('smw-5') || lower.includes('sea-me-we 5') || lower.includes('smw 5'))) ||
        (cId === 'aae1' && (lower.includes('aae1') || lower.includes('aae-1') || lower.includes('aae 1'))) ||
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
      { id: 'srlg-bab-el-mandeb', name: 'Bab el-Mandeb Chokepoint', terms: ['bab el-mandeb', 'bab-el-mandeb', 'red sea chokepoint', 'ಬಾಬ್ ಎಲ್-ಮಾಂಡೆಬ್'] },
      { id: 'srlg-suez-canal', name: 'Suez Canal Subsea Trench', terms: ['suez', 'zafarana', 'abu talat', 'ಸೂಯೆಜ್', 'स्वेज'] },
      { id: 'srlg-strait-of-malacca', name: 'Strait of Malacca', terms: ['malacca', 'singapore strait', 'ಮಲಕ್ಕಾ'] },
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

    // 3. Repair Fleet vessels
    for (const vessel of REPAIR_FLEET) {
      const vName = vessel.name.toLowerCase();
      if (lower.includes(vName) || lower.includes(vessel.id.toLowerCase())) {
        resolved.push({
          type: 'vessel',
          rawMention: vessel.name,
          canonicalId: vessel.id,
          canonicalName: vessel.name,
          confidence: 0.95,
          metadata: {
            currentPort: vessel.currentPort,
            cruisingSpeedKnots: vessel.cruisingSpeedKnots,
            rovRatingM: vessel.rovDepthRatingM,
          },
        });
      }
    }

    return resolved;
  }

  /**
   * Main NLP pipeline: Language detect -> NER -> Intent classification -> Specialist selection
   */
  public async analyzeQuery(
    query: string,
    history: ConversationTurn[] = []
  ): Promise<NLPAnalysisResult> {
    const cleanUserQuery = this.cleanText(query);
    const textToAnalyze = cleanUserQuery.length > 0 ? cleanUserQuery : query;
    const language = this.detectLanguageAndScript(textToAnalyze);
    const { emotionalTone, toneConfidence } = this.detectEmotionalTone(textToAnalyze);
    const localEntities = this.resolveEntitiesLocally(textToAnalyze);

    // Multi-turn context resolution: if user says "it", "these two cables", use previous entities
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

    // Check for conversational / emotional attunement queries
    const lower = textToAnalyze.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(Boolean);

    const conversationalPatterns = [
      /^(hi|hello|hey|yo|sup|namaste|namaskara|namaskaram|greetings|hola)\b/i,
      /^(how are you|how r u|how is it going|how are things|whats up|what's up|wassup|how do you do)/i,
      /^(who are you|what is varunasetu|what can you do|introduce yourself|tell me about yourself)/i,
      /^(dude|bro|man|buddy|mate|macha|bhai|yaar|dost)\b/i,
      /(respond emotionally|be emotional|talk like a human|be human|talk to me|fix this|not working|not responding|be friendly|reply like|chat like a friend|talk like a friend|be a friend|acting so formal|too formal|like a colleague|stop being formal|talk normally)/i,
      /(devaru olleyadu|bhagwan achha|kaise ho|hegiddira|kya haal|en samachara)/i,
      /(marry|marriage|wedding|proposal|will you marry|marry me|love me|date me|fiance)/i,
    ];
    const isConversational = conversationalPatterns.some(p => p.test(lower)) ||
      (words.length <= 4 && (lower === 'hi' || lower === 'hello' || lower === 'hey' || lower === 'yo' || lower === 'dude' || lower === 'bro' || lower === 'help' || lower === 'macha' || lower === 'bhai'));

    if (isConversational) {
      return {
        query,
        primaryIntent: 'CASUAL_CONVERSATION',
        confidence: 0.99,
        entities: mergedEntities,
        language,
        emotionalTone,
        toneConfidence,
        requiresSpecialists: ['orchestrator'],
      };
    }

    // LLM Intent Classification via Groq Qwen 27B
    const systemPrompt = `You are the VARUNASETU Multilingual NLP & NLU Intelligence Core for a submarine telecom digital twin.
Classify the user prompt into one of these canonical intents:
- NETWORK_LOOKUP, CABLE_STATUS, LANDING_STATION_LOOKUP, CABLE_CONNECTIVITY
- REDUNDANCY_ANALYSIS, SRLG_ANALYSIS, FAILURE_IMPACT_ANALYSIS, CORRELATED_FAILURE_ANALYSIS
- SCENARIO_CREATION, SIMULATION_EXECUTION, TRAFFIC_REROUTING_ANALYSIS, CONGESTION_ANALYSIS
- REPAIR_PLANNING, VESSEL_LOOKUP, RECOVERY_COMPARISON, REPORT_GENERATION, DATA_QUALITY_QUERY, GENERAL_EXPLANATION, CASUAL_CONVERSATION

The user input may be in English, Kannada script, Romanized Kannada (e.g., "Ee cable break aadre..."), Hindi script, Romanized Hindi (e.g., "Kya yeh redundant hai..."), or mixed code-switching.
Preserve technical telecom entities regardless of language.

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
Detected Language: ${language.detectedLanguage} (Script: ${language.detectedScript}, Transliterated: ${language.isTransliterated})
Previously active entities: ${JSON.stringify(contextEntities.map(e => `${e.type}:${e.canonicalName}`))}
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
          max_tokens: 450,
        }
      );

      const parsed = JSON.parse(response.content);

      return {
        query,
        primaryIntent: parsed.primaryIntent || 'GENERAL_EXPLANATION',
        confidence: parsed.confidence || 0.9,
        entities: mergedEntities,
        language,
        emotionalTone,
        toneConfidence,
        requiresSpecialists: Array.isArray(parsed.requiresSpecialists)
          ? parsed.requiresSpecialists
          : ['orchestrator', 'network'],
        suggestedAction: parsed.suggestedAction || undefined,
        clarificationNeeded: parsed.clarificationNeeded || undefined,
      };
    } catch (err) {
      console.warn('[NLPEngine] LLM classification fallback to rule-based parser:', err);
      return this.ruleBasedFallback(query, mergedEntities, language, emotionalTone, toneConfidence);
    }
  }

  private ruleBasedFallback(
    query: string,
    entities: ResolvedEntity[],
    language: LanguageMetadata,
    emotionalTone?: EmotionalTone,
    toneConfidence?: number
  ): NLPAnalysisResult {
    const toneInfo = emotionalTone ? { emotionalTone, toneConfidence: toneConfidence ?? 0.85 } : this.detectEmotionalTone(query);
    const lower = query.toLowerCase();
    let intent: CanonicalIntent = 'GENERAL_EXPLANATION';
    const specialists: ('orchestrator' | 'network' | 'risk' | 'logistics' | 'policy')[] = ['orchestrator'];

    if (lower.includes('redundant') || lower.includes('redundancy') || lower.includes('backup') || lower.includes('nijavaglu') || lower.includes('sach')) {
      intent = 'REDUNDANCY_ANALYSIS';
      specialists.push('network', 'risk');
    } else if (lower.includes('srlg') || lower.includes('chokepoint') || lower.includes('shared')) {
      intent = 'SRLG_ANALYSIS';
      specialists.push('network', 'risk');
    } else if (lower.includes('vessel') || lower.includes('ship') || lower.includes('fleet') || lower.includes('rov') || lower.includes('hadagu') || lower.includes('jahaj')) {
      intent = 'VESSEL_LOOKUP';
      specialists.push('logistics');
    } else if (lower.includes('reroute') || lower.includes('traffic') || lower.includes('congestion') || lower.includes('capacity') || lower.includes('alternative') || lower.includes('route')) {
      intent = 'TRAFFIC_REROUTING_ANALYSIS';
      specialists.push('policy', 'network');
    } else if (lower.includes('break') || lower.includes('fail') || lower.includes('rupture') || lower.includes('sever') || lower.includes('aadre') || lower.includes('toot')) {
      intent = 'FAILURE_IMPACT_ANALYSIS';
      specialists.push('network', 'risk', 'logistics');
    }

    return {
      query,
      primaryIntent: intent,
      confidence: 0.85,
      entities,
      language,
      emotionalTone: toneInfo.emotionalTone,
      toneConfidence: toneInfo.toneConfidence,
      requiresSpecialists: specialists,
    };
  }
}

export const nlpEngine = new NLPEngine();
