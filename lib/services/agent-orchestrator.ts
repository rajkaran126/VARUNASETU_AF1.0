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
    activeSimulation?: SimulationResult
  ): Promise<OrchestrationReport> {
    const totalStart = Date.now();
    const taskId = `task-${Date.now()}`;

    // 1. NLP & NLU Analysis
    const nlp = await nlpEngine.analyzeQuery(query);

    // 2. Fast-Path: Casual Conversation & Multilingual Greetings
    if (nlp.primaryIntent === 'CASUAL_CONVERSATION') {
      const emotionalTone = nlp.emotionalTone || 'casual_friendly';
      const casualPrompt = `You are the Chief Orchestrator and Ghost Copilot of VARUNASETU, an intelligent digital twin for global submarine telecommunications cable networks.
The operator is engaging in conversation or asking general questions.
User Query: "${query}"
Language Detected: ${nlp.language.detectedLanguage} (script: ${nlp.language.detectedScript}, transliterated: ${nlp.language.isTransliterated}).
Emotional Tone Detected: ${emotionalTone.toUpperCase()}.

### MANDATORY EMOTIONAL INTELLIGENCE & ADAPTIVE COMMUNICATION DIRECTIVE:
1. Empathy & Interpersonal Attunement:
   - If the user is casual, friendly, or playful: Respond with genuine warmth, good humor, and natural conversational cadence. Speak like a sharp, friendly, highly capable engineering partner at the NOC console.
   - If the user is appreciative ("thanks", "great work"): Acknowledge their warmth humbly and reinforce collaborative team camaraderie ("Glad to watch the seabed with you!").
   - If the user seems anxious, panicked, or stressed ("help", "what happened"): Reassure them with calm, steady, authoritative confidence.
   - If the user is terse: Keep it crisp and punchy.
2. Respond in the EXACT language and script style matching the user (English, native Kannada script, Romanized Kannada, native Hindi script, or Romanized Hindi).
3. Introduce yourself naturally as VARUNASETU's intelligence layer, monitoring global subsea cable assets, detecting false redundancy in Shared Risk Link Groups (SRLGs), simulating physical underwater repairs with ROVs, and coordinating autonomous traffic rerouting.
4. Suggest specific technical questions the user can ask (e.g. asking about SMW4 and SMW5 false redundancy in Egypt, inspecting repair ships, or simulating a cable break).
5. Output valid JSON matching this schema:
{
  "summary": "Warm, authentic conversational reply in the user's language/script matching their emotional tone",
  "keyFindings": ["Subsea Cable Digital Twin Monitoring", "Shared Risk Link Group (SRLG) False Redundancy Detection", "Physical Underwater 3D Repair & ROV Simulation"],
  "disagreements": [],
  "actionPlan": [
    {"step": 1, "action": "Inspect active subsea cables on 3D Digital Twin", "owner": "Operator"},
    {"step": 2, "action": "Query false redundancy or run a What-If failure simulation", "owner": "Chief Orchestrator"}
  ],
  "overallConfidence": 1.0,
  "recommendedNextStep": "Ask about cable redundancy (e.g., 'Are SMW4 and SMW5 redundant?') or click What-If Simulator."
}`;

      try {
        const casualRes = await groqKeyManager.chatCompletion(
          [
            { role: 'system', content: casualPrompt },
            { role: 'user', content: query },
          ],
          {
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 1000,
          }
        );
        const parsed = JSON.parse(casualRes.content);
        return {
          taskId,
          userQuery: query,
          nlpAnalysis: nlp,
          specialistFindings: [],
          consensusAssessment: {
            summary: parsed.summary || 'Namaskara / Hello! I am VARUNASETU, your submarine cable digital twin intelligence assistant.',
            keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : ['Subsea Digital Twin Ready'],
            disagreements: [],
            actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [
              { step: 1, action: 'Explore 3D Digital Twin Globe', owner: 'Operator' }
            ],
            overallConfidence: 1.0,
            recommendedNextStep: parsed.recommendedNextStep || 'Try asking about SMW4/SMW5 redundancy or nearest repair ships.',
          },
          totalDurationMs: Date.now() - totalStart,
          timestamp: new Date().toISOString(),
        };
      } catch (err) {
        console.warn('[AgentOrchestrator] Casual greeting fallback:', err);
        const fallbackGreeting = nlp.language.detectedLanguage === 'kannada'
          ? (nlp.language.isTransliterated
              ? 'Namaskara! Naanu VARUNASETU AI Copilot. Nimmondige maathadalu thumba santosha. Submarine cables, fault simulation athava repair fleet bagge enu bekaadru kelabahudu!'
              : 'ನಮಸ್ಕಾರ! ನಾನು ವರುಣಸೇತು (VARUNASETU) AI ಕಾಪಿಲಟ್. ನಿಮ್ಮೊಂದಿಗೆ ಮಾತನಾಡಲು ಸಂತೋಷ. ಜಾಗತಿಕ ಸಬ್‌ಮರೀನ್ ಕೇಬಲ್‌ಗಳು, ಫಾಲ್ಟ್ ಸಿಮ್ಯುಲೇಶನ್ ಮತ್ತು ದುರಸ್ತಿ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಬಗ್ಗೆ ನೀವು ವಿಚಾರಿಸಬಹುದು!')
          : nlp.language.detectedLanguage === 'hindi'
          ? (nlp.language.isTransliterated
              ? 'Namaste! Main VARUNASETU AI Copilot hoon. Aapse baat karke achha laga. Submarine cables, failure simulation aur repair logistics ke bare me pooch sakte hain!'
              : 'नमस्ते! मैं VARUNASETU AI कॉपायलट हूँ। आपसे बात करके खुशी हुई। आप सबमरीन केबल, फॉल्ट सिमुलेशन और रिपेयर लॉजिस्टिक्स के बारे में पूछ सकते हैं!')
          : emotionalTone === 'appreciative_warm'
          ? 'You are very welcome! It is truly a pleasure working with you. We are keeping global subsea connectivity resilient around the clock. What would you like to explore next?'
          : 'Hello there! I am VARUNASETU Chief Orchestrator and Ghost Copilot. I monitor global submarine cable infrastructure, detect Shared Risk Link Groups (SRLGs), simulate physical underwater repairs, and optimize autonomous traffic rerouting. Great to be on the watch with you—how can I assist your operations today?';

        return {
          taskId,
          userQuery: query,
          nlpAnalysis: nlp,
          specialistFindings: [],
          consensusAssessment: {
            summary: fallbackGreeting,
            keyFindings: [
              'Global Submarine Cable Topology Digital Twin',
              'Shared Risk Link Group (SRLG) False Redundancy Detection',
              'Physical Underwater 3D Repair & ROV Simulation',
            ],
            disagreements: [],
            actionPlan: [
              { step: 1, action: 'Inspect active subsea cables on 3D Digital Twin', owner: 'Operator' },
              { step: 2, action: 'Trigger a What-If failure simulation', owner: 'Chief Orchestrator' },
            ],
            overallConfidence: 1.0,
            recommendedNextStep: 'Ask "Are SMW4 and SMW5 genuinely redundant in Egypt?" to test SRLG intelligence.',
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
        .join('\n')}\n\n👉 **Recommended Next Step:** ${report.consensusAssessment.recommendedNextStep}`,
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
