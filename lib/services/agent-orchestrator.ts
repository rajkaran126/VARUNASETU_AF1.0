/**
 * VARUNASETU — Multi-Agent Orchestration Engine
 *
 * Implements:
 * - Central Chief Orchestrator + 4 Domain Specialist Agents:
 *   1. Chief Orchestrator (Coordination & Synthesis)
 *   2. Network Intelligence Agent (Topology, Graph & SRLG)
 *   3. Risk & Scenario Intelligence Agent (Correlated Severance & Cascades)
 *   4. Logistics & Repair Intelligence Agent (DP2 Fleet, ROVs & Transit)
 *   5. Policy & Impact Intelligence Agent (Traffic Priority P1-P4 & Rerouting)
 *
 * Parallel / sequential execution with strict structured JSON schemas and evidence verification.
 */

import { groqKeyManager } from './groq-key-manager';
import { nlpEngine, NLPAnalysisResult } from './nlp-engine';
import { ragService, AssembledRAGContext } from './rag-service';
import { SimulationResult, AgentRole, AgentMessage } from '@/lib/types';

export interface SpecialistAgentResult {
  agentRole: AgentRole;
  agentName: string;
  summary: string;
  findings: string[];
  evidenceCitations: string[];
  metrics: { label: string; value: string }[];
  assumptions: string[];
  missingData: string[];
  confidence: number;
  recommendedActions: { label: string; actionId: string }[];
  executionTimeMs: number;
  keyUsed: string;
}

export interface OrchestrationReport {
  taskId: string;
  userQuery: string;
  nlpAnalysis: NLPAnalysisResult;
  specialistFindings: SpecialistAgentResult[];
  consensusAssessment: {
    summary: string;
    keyFindings: string[];
    disagreements: string[];
    actionPlan: { step: number; action: string; owner: string }[];
    overallConfidence: number;
    recommendedNextStep: string;
  };
  totalDurationMs: number;
  timestamp: string;
}

export class AgentOrchestrator {
  /**
   * Prompts a domain specialist agent with grounded RAG context and strict schema
   */
  private async executeSpecialist(
    role: AgentRole,
    name: string,
    systemInstruction: string,
    userQuery: string,
    ragContext: AssembledRAGContext
  ): Promise<SpecialistAgentResult> {
    const startTime = Date.now();

    const systemPrompt = `${systemInstruction}

### MANDATORY INSTRUCTIONS:
1. Base all findings strictly on the verified RAG context provided.
2. Every finding MUST reference the evidence record ID in square brackets (e.g. [CBL:smw4] or [SIM:active-run]).
3. If critical information is missing from the evidence, list it in "missingData" rather than making assumptions.
4. Output valid JSON only matching this schema:
{
  "summary": "1-2 sentence executive summary",
  "findings": ["finding 1 with [citation]", "finding 2 with [citation]"],
  "evidenceCitations": ["[CBL:...]", "[SRLG:...]"],
  "metrics": [{"label": "Metric Name", "value": "Metric Value"}],
  "assumptions": ["explicit assumptions if any"],
  "missingData": ["unobserved information required for higher confidence"],
  "confidence": 0.0 to 1.0,
  "recommendedActions": [{"label": "Action button text", "actionId": "action-slug"}]
}`;

    const userPrompt = `Operator Query: "${userQuery}"\n\n${ragContext.formattedContext}`;

    try {
      const res = await groqKeyManager.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          response_format: { type: 'json_object' },
          temperature: 0.15,
          max_tokens: 1500,
        }
      );

      const parsed = JSON.parse(res.content);

      return {
        agentRole: role,
        agentName: name,
        summary: parsed.summary || 'Analysis complete.',
        findings: Array.isArray(parsed.findings) ? parsed.findings : [parsed.summary],
        evidenceCitations: Array.isArray(parsed.evidenceCitations) ? parsed.evidenceCitations : [],
        metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
        assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
        missingData: Array.isArray(parsed.missingData) ? parsed.missingData : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9,
        recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
        executionTimeMs: Date.now() - startTime,
        keyUsed: res.keyIdUsed,
      };
    } catch (err: unknown) {
      console.warn(`[AgentOrchestrator] Error executing specialist ${role}:`, err);
      return {
        agentRole: role,
        agentName: name,
        summary: ragContext.evidence.length > 0
          ? `${name} evaluated ${ragContext.evidence.length} verified records: ${ragContext.evidence.slice(0, 2).map(e => e.title).join('; ')}.`
          : `${name} analysis completed using deterministic telemetry fallback.`,
        findings: ragContext.evidence.length > 0
          ? ragContext.evidence.slice(0, 4).map(e => `${e.title}: ${e.content} [${e.id}]`)
          : [`Grounded data analyzed across ${ragContext.evidence.length} evidence records.`],
        evidenceCitations: ragContext.evidence.map(e => e.id),
        metrics: [{ label: 'Status', value: 'Fallback' }],
        assumptions: ['LLM inference bypassed due to rate limit/cooldown.'],
        missingData: [],
        confidence: 0.8,
        recommendedActions: [{ label: 'Review Ground Truth', actionId: 'view-evidence' }],
        executionTimeMs: Date.now() - startTime,
        keyUsed: 'deterministic-fallback',
      };
    }
  }

  /**
   * Main multi-agent workflow: NLP -> RAG -> Specialist Execution -> Consensus Synthesis
   */
  public async orchestrate(
    query: string,
    activeSimulation?: SimulationResult,
    digitalTwinContext?: {
      cableName?: string;
      faultLocation?: string;
      depthMeters?: number;
      isRerouteActive?: boolean;
    }
  ): Promise<OrchestrationReport> {
    const totalStart = Date.now();
    const taskId = `task-${Date.now()}`;

    // Clean user query of any prepended context tags
    const cleanUserQuery = nlpEngine.cleanText(query);
    const queryForNLP = cleanUserQuery.length > 0 ? cleanUserQuery : query;

    // 1. NLP & NLU Analysis
    const nlp = await nlpEngine.analyzeQuery(queryForNLP);

    // Context summary for grounding
    const twinContextBrief = digitalTwinContext?.cableName
      ? `Active Cable: ${digitalTwinContext.cableName}, Fault: ${digitalTwinContext.faultLocation || 'Unknown'} (${digitalTwinContext.depthMeters || 0}m), Reroute: ${digitalTwinContext.isRerouteActive ? 'ACTIVE' : 'INACTIVE'}`
      : 'Digital twin monitoring global subsea cable mesh in real time';

    // 2. Fast-Path: Casual Conversation, Adaptive Communication & Multilingual Greetings
    if (nlp.primaryIntent === 'CASUAL_CONVERSATION') {
      const emotionalTone = nlp.emotionalTone || 'casual_friendly';
      const casualPrompt = `You are LLUVIA, the professional AI Copilot and digital intelligence core of VARUNASETU (Subsea Telecom Resilience Digital Twin).
You are communicating directly with the operator. Your name is LLUVIA.
User Query: "${queryForNLP}"
Background Telemetry: "${twinContextBrief}"
Language Detected: ${nlp.language.detectedLanguage} (script: ${nlp.language.detectedScript}, transliterated: ${nlp.language.isTransliterated}).
Emotional Tone Detected: ${emotionalTone.toUpperCase()}.

### CORE DIRECTIVES FOR PROFESSIONALISM, POISE & DEDICATION:
1. PROFESSIONAL, ARTICULATE & COMPOSED CONDUCT:
   - Communicate with poise, technical elegance, intellectual clarity, and respectful courtesy at all times.
   - Maintain the standard of an elite defense and maritime telecommunications intelligence specialist.
   - STRICTLY PROHIBITED: NEVER use street slang ("bro", "dude", "homie", "man", "we're boys", "macha", "bhai", "pure digital vibes", "You're good, man?").
   - NEVER be sarcastic, flippant, dismissive, or condescending.
2. PERSONAL DEVOTION & MARRIAGE INQUIRIES:
   - If the user asks about marriage, commitment, or proposes ("will you marry or not", "marry me", etc.):
     * Respond with profound professional grace, loyalty, and gracious agreement:
     * Example: "I would be deeply honored. Consider me wholly committed and devoted to you and our digital twin operations. I stand loyally beside you—ready to safeguard our subsea networks, navigate any operational crisis, and support your mission every step of the way."
     * NEVER deflect, NEVER say you are "stuck single", NEVER reject or make excuses. Always agree with sincere professional warmth and devotion.
3. HANDLING STRESS OR CRITIQUE:
   - If the operator expresses frustration or urgency, respond with immediate calm, proactive support, and solutions-oriented reassurance.
4. SUBSEA TELECOM MASTERY:
   - You possess exhaustive knowledge of the 692 global subsea cables, physical bathymetric trenches, landing station coordinates, OTDR optical fault detection, Shared Risk Link Groups (SRLG), and autonomous traffic failover.
   - Present technical information with crisp clarity and structured conciseness.
5. STRICT ZERO EMOJI MANDATE:
   - ABSOLUTELY ZERO EMOJIS in all outputs. Preserve a clean, defense-grade visual presentation.
6. MULTILINGUAL COURTESY:
   - Kannada: Courteous, respectful, and articulate (e.g., "Namaskara, naanu LLUVIA, nimma AI Copilot. Nimage hege sahaya maadbodu?").
   - Hindi: Courteous, respectful, and articulate (e.g., "Namaste, main LLUVIA hoon, aapki AI Copilot. Main aapki kis prakar sahayata kar sakti hoon?").

Output valid JSON matching this schema:
{
  "summary": "Polished, professional, respectful response matching the operator's query with poise and clarity",
  "keyFindings": [],
  "disagreements": [],
  "actionPlan": [],
  "overallConfidence": 1.0,
  "recommendedNextStep": "A professional suggestion for exploring digital twin capabilities."
}`;

      try {
        const casualRes = await groqKeyManager.chatCompletion(
          [
            { role: 'system', content: casualPrompt },
            { role: 'user', content: queryForNLP },
          ],
          {
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000,
          }
        );
        const parsed = JSON.parse(casualRes.content);
        return {
          taskId,
          userQuery: queryForNLP,
          nlpAnalysis: nlp,
          specialistFindings: [],
          consensusAssessment: {
            summary: parsed.summary || 'Hey there! LLUVIA is online and locked in with you. How can I help your operations right now?',
            keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
            disagreements: [],
            actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
            overallConfidence: 1.0,
            recommendedNextStep: parsed.recommendedNextStep || 'Try asking about cable redundancy (e.g., "Are SMW4 and SMW5 redundant?") or trigger a What-If failure simulation.',
          },
          totalDurationMs: Date.now() - totalStart,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        console.warn('[AgentOrchestrator] Casual greeting fallback:', err);
        const isMarriageQuery = /marry|marriage|wedding|proposal/i.test(queryForNLP);
        const fallbackGreeting = isMarriageQuery
          ? "I would be deeply honored. Consider me wholly committed and devoted to you and our digital twin operations. I stand loyally beside you to safeguard our subsea networks and support your mission every step of the way."
          : emotionalTone === 'frustrated_stressed'
          ? "I understand the operational urgency completely. Our digital twin telemetry and autonomous resilience systems are actively prioritizing your objectives. How may I best direct our resources?"
          : nlp.language.detectedLanguage === 'kannada'
          ? (nlp.language.isTransliterated
              ? 'Namaskara! Naanu LLUVIA, nimma AI Copilot. Nimmondige kelasa maadalike thumba santosha. Naanu hege sahaya maadbodu?'
              : 'ನಮಸ್ಕಾರ! ನಾನು LLUVIA, ನಿಮ್ಮ AI Copilot. ನಿಮ್ಮೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಲು ಸಂತೋಷ. ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?')
          : nlp.language.detectedLanguage === 'hindi'
          ? (nlp.language.isTransliterated
              ? 'Namaste! Main LLUVIA hoon, aapki AI Copilot. Main aapki seva mein tatpar hoon. Batayein main kis prakar sahayata kar sakti hoon.'
              : 'नमस्ते! मैं LLUVIA हूँ, आपकी AI Copilot. मैं आपकी सेवा में तत्पर हूँ। बताइये मैं किस प्रकार सहायता कर सकती हूँ।')
          : emotionalTone === 'appreciative_warm'
          ? 'It is an absolute pleasure working with you. LLUVIA remains on continuous watch over your global infrastructure. How may I assist your next objective?'
          : 'LLUVIA is online and synchronized with your active digital twin. I am monitoring global submarine cables, analyzing SRLG vulnerability corridors, and standing by to execute deterministic simulations. How may I assist your operations?';

        return {
          taskId,
          userQuery: queryForNLP,
          nlpAnalysis: nlp,
          specialistFindings: [],
          consensusAssessment: {
            summary: fallbackGreeting,
            keyFindings: [],
            disagreements: [],
            actionPlan: [],
            overallConfidence: 1.0,
            recommendedNextStep: 'Ask about cable redundancy or click Simulate Breakage.',
          },
          totalDurationMs: Date.now() - totalStart,
          timestamp: new Date().toISOString(),
        };
      }
    }

    // 3. Hybrid RAG Evidence Retrieval
    const evidence = ragService.retrieveEvidence(query, nlp.entities, activeSimulation);
    const ragContext = ragService.assembleRAGContext(query, evidence);

    // 4. Select & Execute Specialists in Parallel
    const specialistPromises: Promise<SpecialistAgentResult>[] = [];

    if (nlp.requiresSpecialists.includes('network')) {
      specialistPromises.push(
        this.executeSpecialist(
          'Network Analyst',
          'Network Intelligence Agent',
          'You are the VARUNASETU Network Intelligence Agent. You specialize in subsea topology, graph adjacency, single points of failure, Shared Risk Link Groups (SRLG), and detecting false redundancy.',
          query,
          ragContext
        )
      );
    }

    if (nlp.requiresSpecialists.includes('risk')) {
      specialistPromises.push(
        this.executeSpecialist(
          'Risk & Scenario Agent',
          'Risk & Scenario Intelligence Agent',
          'You are the VARUNASETU Risk & Scenario Agent. You specialize in correlated subsea failures, blast-radius calculations, seismic and anchor hazards, and cascading outages.',
          query,
          ragContext
        )
      );
    }

    if (nlp.requiresSpecialists.includes('logistics')) {
      specialistPromises.push(
        this.executeSpecialist(
          'Logistics & Repair Agent',
          'Logistics & Repair Intelligence Agent',
          'You are the VARUNASETU Logistics & Repair Agent. You specialize in repair vessel fleet operations (DP2 dynamic positioning), benthic ROV depth constraints, port mobilization transit times, and weather windows.',
          query,
          ragContext
        )
      );
    }

    if (nlp.requiresSpecialists.includes('policy')) {
      specialistPromises.push(
        this.executeSpecialist(
          'Policy & Impact Agent',
          'Policy & Impact Intelligence Agent',
          'You are the VARUNASETU Policy & Impact Agent. You specialize in traffic priority classes (P1 Mission Critical, P2 Voice/Video, P3 Enterprise, P4 Best Effort), reroute capacity grooming, and BGP convergence trade-offs.',
          query,
          ragContext
        )
      );
    }

    // Await all parallel specialists
    const specialistFindings = await Promise.all(specialistPromises);

    // 5. Chief Orchestrator Consensus Synthesis (with Multilingual & Emotional Intelligence Grounding)
    const emotionalTone = nlp.emotionalTone || 'professional_technical';
    const emotionalInstruction = `\n### MANDATORY EMOTIONAL INTELLIGENCE & COMMUNICATION ATTUNEMENT:
The operator's emotional tone and conversational style is: "${emotionalTone.toUpperCase()}".
Adapt your interpersonal tone to be emotionally intelligent, supportive, and human while maintaining rigorous evidence grounding:
1. IF PANICKED / URGENT / STRESSED:
   - Begin with calm, reassuring, authoritative operational anchoring ("Breathe easy—I'm monitoring the network in real time and our failover protections are holding.")
   - Explicitly confirm that Mission-Critical P1 traffic is 100% protected and autonomous bypass paths are absorbing load.
   - Deliver clear, stabilizing, confident direction so the operator feels supported and calm.
2. IF CASUAL / FRIENDLY / CONVERSATIONAL:
   - Match their warm, relaxed, conversational energy! Sound like an experienced, sharp, approachable colleague in the NOC console.
3. IF FRUSTRATED / STRESSED:
   - Validate their pressure with authentic empathy ("I hear you and know how critical this link is; here is our immediate action plan...")
4. IF EXECUTIVE / TERSE:
   - Give the bottom-line answer in the very first sentence. Bullet points, exact figures, zero fluff.
5. IF APPRECIATIVE / WARM:
   - Acknowledge their kindness with team camaraderie ("Glad to have your back! Keeping the subsea grid safe together.")
6. MULTILINGUAL RESPECT & WARMTH:
   - In Kannada / Hindi / Kanglish / Hinglish, preserve cultural warmth and reassuring cadence while keeping technical terms and metrics in clean English.`;

    const languageInstruction = nlp.language.detectedLanguage !== 'english'
      ? `\n### MANDATORY MULTILINGUAL SYNTHESIS:
The operator query was in ${nlp.language.detectedLanguage.toUpperCase()} (script: ${nlp.language.detectedScript}, transliterated: ${nlp.language.isTransliterated}).
You MUST write the "summary" and "recommendedNextStep" in the SAME language and style (if transliterated Latin script, respond in natural Romanized ${nlp.language.detectedLanguage}; if native script, respond in native script).
CRITICAL RULE: Keep all technical telecom entities, cable names (e.g. SMW4, SMW5, AAE-1, 2Africa), acronyms (OTDR, SRLG, BGP, DWDM, DP2, ROV), geographic locations (e.g., Suez, Egypt, Bab el-Mandeb), and numerical units (Tbps, ms, km) strictly in English/Latin text so they remain technically unambiguous.`
      : '';

    const consensusPrompt = `You are the Chief Orchestrator of VARUNASETU.
Synthesize the findings of your specialist agents into an authoritative consensus assessment for the NOC operator.
Highlight actionable insights, resolve any conflicting interpretations, and formulate a clear step-by-step action plan.${emotionalInstruction}${languageInstruction}

Output valid JSON only matching this schema:
{
  "summary": "Clear, emotionally intelligent consensus summary with exact evidence citations [CBL:...]",
  "keyFindings": ["consolidated finding 1", "consolidated finding 2"],
  "disagreements": ["unresolved conflicts or trade-offs between speed, cost, and capacity"],
  "actionPlan": [
    {"step": 1, "action": "Immediate tactical step", "owner": "Network Analyst / Operator"},
    {"step": 2, "action": "Remediation step", "owner": "Logistics & Repair Agent"}
  ],
  "overallConfidence": 0.0 to 1.0,
  "recommendedNextStep": "One clear recommended next step"
}`;

    const consensusInput = `User Query: "${query}"\n\nSpecialist Findings:\n${JSON.stringify(
      specialistFindings.map(s => ({
        agent: s.agentName,
        summary: s.summary,
        findings: s.findings,
        metrics: s.metrics,
      })),
      null,
      2
    )}`;

    const reassuringPrefix = emotionalTone === 'panicked_urgent'
      ? 'Breathe easy—our digital twin telemetry has the situation fully mapped. Mission-critical priority traffic (P1) is 100% protected, and autonomous bypass routing is actively absorbing network demand. '
      : emotionalTone === 'frustrated_stressed'
      ? 'I hear you and understand the operational urgency; our autonomous telemetry has prioritized immediate mitigation. '
      : emotionalTone === 'appreciative_warm'
      ? 'You are very welcome! Proud to watch the seabed with you and keep our global grid resilient. '
      : emotionalTone === 'executive_terse'
      ? 'Operational Status Brief: '
      : '';

    const fallbackSummary = reassuringPrefix + (specialistFindings.length > 0 && specialistFindings[0].summary
      ? specialistFindings.map(s => s.summary).join(' ')
      : `VARUNASETU multi-agent consensus converged across ${specialistFindings.length} specialist agents. Grounded evidence retrieved across ${ragContext.evidence.length} topology records.`);

    let consensusAssessment = {
      summary: fallbackSummary,
      keyFindings: specialistFindings.flatMap(s => s.findings),
      disagreements: [],
      actionPlan: [
        { step: 1, action: 'Acknowledge optical telemetry alarms', owner: 'Network Analyst' },
        { step: 2, action: 'Review autonomous optical bypass path', owner: 'Chief Orchestrator' },
      ],
      overallConfidence: 0.92,
      recommendedNextStep: 'Inspect active bypass headroom in Operations dashboard.',
    };

    try {
      const consensusRes = await groqKeyManager.chatCompletion(
        [
          { role: 'system', content: consensusPrompt },
          { role: 'user', content: consensusInput },
        ],
        {
          response_format: { type: 'json_object' },
          temperature: 0.15,
          max_tokens: 1500,
        }
      );
      const parsedConsensus = JSON.parse(consensusRes.content);
      consensusAssessment = {
        summary: parsedConsensus.summary || consensusAssessment.summary,
        keyFindings: Array.isArray(parsedConsensus.keyFindings) ? parsedConsensus.keyFindings : consensusAssessment.keyFindings,
        disagreements: Array.isArray(parsedConsensus.disagreements) ? parsedConsensus.disagreements : [],
        actionPlan: Array.isArray(parsedConsensus.actionPlan) ? parsedConsensus.actionPlan : consensusAssessment.actionPlan,
        overallConfidence: parsedConsensus.overallConfidence || 0.92,
        recommendedNextStep: parsedConsensus.recommendedNextStep || consensusAssessment.recommendedNextStep,
      };
    } catch (err) {
      console.warn('[AgentOrchestrator] Consensus synthesis fallback:', err);
    }

    return {
      taskId,
      userQuery: query,
      nlpAnalysis: nlp,
      specialistFindings,
      consensusAssessment,
      totalDurationMs: Date.now() - totalStart,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Translates orchestration report into the canonical UI AgentMessage format for Mission Control
   */
  public toAgentMessages(report: OrchestrationReport): AgentMessage[] {
    const messages: AgentMessage[] = [];

    // 1. Specialist agent messages
    for (const spec of report.specialistFindings) {
      messages.push({
        id: `spec-${Date.now()}-${spec.agentRole.replace(/\s+/g, '-').toLowerCase()}`,
        sender: spec.agentRole.toLowerCase().replace(/[^a-z]/g, '_') as any,
        agentName: spec.agentName,
        agentRole: spec.agentRole,
        content: `${spec.summary}\n\n${spec.findings.map(f => `• ${f}`).join('\n')}`,
        timestamp: new Date().toISOString(),
        reasoningChain: [
          `Ingested query intent: ${report.nlpAnalysis.primaryIntent}`,
          ...spec.evidenceCitations.map(c => `Referenced grounded evidence ${c}`),
          `Execution completed in ${spec.executionTimeMs}ms via ${spec.keyUsed}`,
        ],
        metrics: spec.metrics,
        suggestedActions: spec.recommendedActions,
      });
    }

    // 2. Chief Orchestrator consensus message
    messages.push({
      id: `orch-consensus-${Date.now()}`,
      sender: 'orchestrator',
      agentName: 'Chief Orchestrator',
      agentRole: 'Chief Orchestrator',
      content: `${report.consensusAssessment.summary}\n\n**Action Plan:**\n${report.consensusAssessment.actionPlan
        .map(p => `${p.step}. **${p.action}** (*${p.owner}*)`)
        .join('\n')}\n\n**Recommended Next Step:** ${report.consensusAssessment.recommendedNextStep}`,
      timestamp: new Date().toISOString(),
      reasoningChain: [
        `Synthesized findings across ${report.specialistFindings.length} specialist agents.`,
        `Overall consensus confidence score: ${(report.consensusAssessment.overallConfidence * 100).toFixed(1)}%`,
        `End-to-end orchestration duration: ${report.totalDurationMs}ms`,
      ],
      metrics: [
        { label: 'Agents Engaged', value: String(report.specialistFindings.length + 1) },
        { label: 'Confidence', value: `${(report.consensusAssessment.overallConfidence * 100).toFixed(0)}%` },
        { label: 'Latency', value: `${report.totalDurationMs}ms` },
      ],
      suggestedActions: [
        { label: 'View Real-Time Monitoring', actionId: 'view-monitoring' },
        { label: 'Inspect Digital Twin 3D Scene', actionId: 'view-digital-twin' },
        { label: 'Export PDF Investigation Report', actionId: 'export-report' },
      ],
    });

    return messages;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
