// scripts/verify-chatbot-and-redundancy.mjs
// End-to-End Operational Verification of AI Chatbot Accuracy and False Redundancy Workflow

import { VERIFIED_CABLE_ROUTES } from '../lib/cable-data.ts';
import { detectAllSRLGGroups, assessFalseRedundancy } from '../lib/services/srlg.service.ts';
import { executeScenario, FALSE_REDUNDANCY_SCENARIO_PRESETS, compareScenarios } from '../lib/services/scenario-execution.service.ts';

async function verifyAll() {
  console.log('================================================================');
  console.log('  VARUNASETU OPERATIONAL & ACCURACY VERIFICATION SUITE');
  console.log('  1. Chatbot Accuracy & Standard Response Verification');
  console.log('  2. Fault & False Redundancy Full Workflow & Tracking');
  console.log('================================================================\n');

  let checksPassed = 0;
  let totalChecks = 0;

  function assert(condition, message) {
    totalChecks++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      checksPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
    }
  }

  // ============================================================================
  // PART 1: CHATBOT ACCURACY & STANDARD NOC RESPONSE VERIFICATION
  // ============================================================================
  console.log('>>> [PART 1] TESTING CHATBOT ACCURACY ACROSS TECHNICAL QUERIES...\n');

  const testQueries = [
    {
      label: 'Suez False Redundancy Inquiry',
      query: 'Are SMW4 and SMW5 genuinely redundant in Egypt?',
      expectedIntent: ['REDUNDANCY_ANALYSIS', 'SRLG_ANALYSIS', 'NETWORK_LOOKUP'],
      mustContainCitations: ['[SRLG:egypt-transit-ducts]', '[CBL:smw4]'],
      keywords: ['redundant', 'transit duct', 'srlg', 'egypt', 'suez'],
    },
    {
      label: 'Logistics & Repair Vessel Dispatch',
      query: 'Which DP2 repair vessel can reach the fault at Djibouti and what is its transit ETA?',
      expectedIntent: ['REPAIR_PLANNING', 'VESSEL_LOOKUP'],
      mustContainCitations: ['[VES:vessel-'],
      keywords: ['vessel', 'transit', 'eta', 'port'],
    },
    {
      label: 'Optical Impairment & Traffic Bypass Capacity',
      query: 'What is the optical attenuation loss on SMW4 and is bypass capacity sufficient?',
      expectedIntent: ['CABLE_STATUS', 'TRAFFIC_REROUTING_ANALYSIS', 'CONGESTION_ANALYSIS'],
      keywords: ['loss', 'db', 'capacity', 'bypass', 'tbps'],
    },
    {
      label: 'Romanized Kannada False Redundancy Query',
      query: 'SMW4 mathu SMW5 Egypt nalli redundant idhiya?',
      expectedLang: 'kannada',
      isTransliterated: true,
      keywords: ['smw4', 'smw5', 'egypt'],
    },
  ];

  for (const tq of testQueries) {
    console.log(`--- Query: "${tq.query}" (${tq.label}) ---`);
    const start = Date.now();

    try {
      const res = await fetch('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tq.query }),
      });

      assert(res.ok, `HTTP status 200 OK received (${Date.now() - start}ms)`);
      const data = await res.json();
      const report = data.report;
      const nlp = report?.nlpAnalysis;
      const consensus = report?.consensusAssessment;

      console.log(`    Primary Intent Detected: ${nlp?.primaryIntent} (confidence: ${(nlp?.confidence * 100).toFixed(0)}%)`);
      console.log(`    Language: ${nlp?.language?.detectedLanguage} (script: ${nlp?.language?.detectedScript}, transliterated: ${nlp?.language?.isTransliterated})`);
      console.log(`    Entities Resolved: ${nlp?.entities?.map(e => `${e.canonicalName} [${e.type}]`).join(', ') || 'None'}`);
      console.log(`    Consensus Summary: "${consensus?.summary?.slice(0, 180)}..."`);
      console.log(`    Recommended Next Step: ${consensus?.recommendedNextStep}`);

      // Accuracy Assertions
      if (tq.expectedIntent) {
        assert(tq.expectedIntent.includes(nlp?.primaryIntent), `Intent "${nlp?.primaryIntent}" is within expected canonical set`);
      }

      if (tq.expectedLang) {
        assert(nlp?.language?.detectedLanguage === tq.expectedLang, `Language detected as "${tq.expectedLang}"`);
        assert(nlp?.language?.isTransliterated === tq.isTransliterated, `Transliteration flag is ${tq.isTransliterated}`);
      }

      if (tq.keywords) {
        const findingsText = (report?.specialistFindings || []).flatMap(s => s.findings).join(' ');
        const textToSearch = (consensus?.summary + ' ' + consensus?.keyFindings?.join(' ') + ' ' + findingsText).toLowerCase();
        const foundKeywords = tq.keywords.filter(k => textToSearch.includes(k.toLowerCase()));
        assert(foundKeywords.length >= 1, `Technical response contains key domain terminology: ${foundKeywords.join(', ')}`);
      }

      assert(consensus?.actionPlan?.length > 0, `Structured actionable NOC steps generated: ${consensus?.actionPlan?.length} steps`);
      assert(consensus?.overallConfidence >= 0.8, `Confidence score authoritative: ${(consensus?.overallConfidence * 100).toFixed(0)}%`);
    } catch (err) {
      assert(false, `API execution failed: ${err.message}`);
    }
    console.log();
  }

  // ============================================================================
  // PART 2: FAULT REDUNDANCY FULL WORKFLOW & TRACKING
  // ============================================================================
  console.log('>>> [PART 2] TESTING FAULT & FALSE REDUNDANCY FULL TRACKING WORKFLOW...\n');

  console.log('Step 1: Detecting Shared Risk Link Groups (SRLGs) across all cables...');
  const srlgGroups = detectAllSRLGGroups(VERIFIED_CABLE_ROUTES);
  assert(srlgGroups.length > 0, `SRLG detection completed: ${srlgGroups.length} shared-risk groups identified`);

  const corridorSRLGs = srlgGroups.filter(g => g.groupType === 'geographic_corridor');
  const landingSRLGs = srlgGroups.filter(g => g.groupType === 'shared_landing_station');
  const hazardSRLGs = srlgGroups.filter(g => g.groupType === 'hazard_exposure');
  console.log(`    • Geographic Corridor Overlaps: ${corridorSRLGs.length}`);
  console.log(`    • Shared Landing Station Groups: ${landingSRLGs.length}`);
  console.log(`    • Hazard Exposure Groups: ${hazardSRLGs.length}\n`);

  console.log('Step 2: Assessing False Redundancy between SMW4 and SMW5 (Suez / Egypt Corridor)...');
  const fraResult = assessFalseRedundancy('smw4', 'smw5', VERIFIED_CABLE_ROUTES, srlgGroups);
  console.log(`    Assessment ID: ${fraResult.id}`);
  console.log(`    Classification: ${fraResult.classification}`);
  console.log(`    Shared Landing Stations: ${fraResult.sharedLandingStationIds.length} [${fraResult.sharedLandingStationIds.join(', ')}]`);
  console.log(`    Shared SRLG IDs: ${fraResult.sharedSRLGIds.join(', ')}`);
  console.log(`    Minimum Route Separation: ${fraResult.geographicSeparationKm?.toFixed(1) || '0'} km`);
  console.log(`    Rationale: ${fraResult.rationale}`);
  console.log(`    Confidence: ${fraResult.confidence} (${fraResult.evidenceClass})`);

  assert(
    fraResult.classification === 'Shared_Corridor_Exposure' || fraResult.classification === 'Shared_Landing_Station_Dependency',
    `SMW4 vs SMW5 classified as having true dependency (${fraResult.classification})`
  );
  assert(fraResult.confidence === 'High', `Assessment carries High confidence backing`);
  console.log();

  console.log('Step 3: Executing Correlated Failure Scenarios from Presets...');
  const presetA = FALSE_REDUNDANCY_SCENARIO_PRESETS.find(p => p.type === 'A_independent_paths');
  const presetB = FALSE_REDUNDANCY_SCENARIO_PRESETS.find(p => p.type === 'B_shared_corridor');
  const presetC = FALSE_REDUNDANCY_SCENARIO_PRESETS.find(p => p.type === 'C_shared_landing');

  assert(!!presetA && !!presetB && !!presetC, 'Scenario presets A, B, and C loaded');

  console.log(`\n  Executing Preset A: "${presetA.title}"...`);
  const resultA = executeScenario(presetA.config, VERIFIED_CABLE_ROUTES);
  console.log(`    Served: ${resultA.allocationResult.totalServedTbps.toFixed(1)} Tbps | Unserved: ${resultA.allocationResult.totalUnservedTbps.toFixed(1)} Tbps`);
  console.log(`    Recovery Time: ${resultA.networkRecoveryTimeHours} hrs | Congested Edges: ${resultA.allocationResult.congestedEdges.length}`);

  console.log(`\n  Executing Preset B (Shared Corridor - False Redundancy): "${presetB.title}"...`);
  const resultB = executeScenario(presetB.config, VERIFIED_CABLE_ROUTES);
  console.log(`    Served: ${resultB.allocationResult.totalServedTbps.toFixed(1)} Tbps | Unserved: ${resultB.allocationResult.totalUnservedTbps.toFixed(1)} Tbps`);
  console.log(`    Recovery Time: ${resultB.networkRecoveryTimeHours} hrs | Congested Edges: ${resultB.allocationResult.congestedEdges.length}`);

  // Validate Traffic Conservation
  const offeredA = resultA.allocationResult.totalOfferedTbps;
  const sumA = resultA.allocationResult.totalServedTbps + resultA.allocationResult.totalUnservedTbps;
  assert(Math.abs(offeredA - sumA) < 0.1, `Preset A strict traffic conservation verified: ${offeredA.toFixed(1)} == ${sumA.toFixed(1)} Tbps`);

  const offeredB = resultB.allocationResult.totalOfferedTbps;
  const sumB = resultB.allocationResult.totalServedTbps + resultB.allocationResult.totalUnservedTbps;
  assert(Math.abs(offeredB - sumB) < 0.1, `Preset B strict traffic conservation verified: ${offeredB.toFixed(1)} == ${sumB.toFixed(1)} Tbps`);

  // Compare Independent vs False Redundancy Impact
  console.log('\nStep 4: Comparing Independent Failure vs False Redundancy (Correlated Outage)...');
  const comparison = compareScenarios([
    { name: presetA.title, config: presetA.config },
    { name: presetB.title, config: presetB.config },
  ]);
  const scenarioARes = comparison.scenarios[0]?.result;
  const scenarioBRes = comparison.scenarios[1]?.result;

  console.log(`    Scenario A (Independent) Served: ${scenarioARes?.allocationResult?.totalServedTbps.toFixed(1)} Tbps`);
  console.log(`    Scenario B (Correlated) Served: ${scenarioBRes?.allocationResult?.totalServedTbps.toFixed(1)} Tbps`);
  console.log(`    Best for Total Volume: ${comparison.summary.bestTotalCapacityScenario}`);
  console.log(`    Fastest Restoration: ${comparison.summary.fastestRestorationScenario}`);

  assert(comparison.scenarios.length === 2, 'Scenario comparison produced evaluations for both scenarios');
  assert(!!comparison.summary.bestTotalCapacityScenario, 'Optimal restoration policy formulated in comparison summary');

  console.log('\nStep 5: Verifying Multi-Class Priority Allocation under False Redundancy...');
  const trafficClasses = resultB.allocationResult.trafficClasses || [];
  const p1Class = trafficClasses.find(c => c.priority === 1 || c.name.toLowerCase().includes('critical'));
  const p4Class = trafficClasses.find(c => c.priority === 4 || c.name.toLowerCase().includes('best effort') || c.name.toLowerCase().includes('bulk'));

  if (p1Class && p4Class) {
    const p1Ratio = p1Class.servedDemandTbps / (p1Class.offeredDemandTbps || 1);
    const p4Ratio = p4Class.servedDemandTbps / (p4Class.offeredDemandTbps || 1);
    console.log(`    P1 (Mission Critical) Served Ratio: ${(p1Ratio * 100).toFixed(1)}% (${p1Class.servedDemandTbps.toFixed(1)}/${p1Class.offeredDemandTbps.toFixed(1)} Tbps)`);
    console.log(`    P4 (Best Effort) Served Ratio: ${(p4Ratio * 100).toFixed(1)}% (${p4Class.servedDemandTbps.toFixed(1)}/${p4Class.offeredDemandTbps.toFixed(1)} Tbps)`);
    assert(p1Ratio >= p4Ratio, 'QoS Priority enforcement verified: P1 Mission Critical protected before P4 Best Effort');
  } else {
    assert(trafficClasses.length > 0, `Traffic priority classes verified: ${trafficClasses.length} QoS tiers active`);
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION COMPLETE: ${checksPassed} / ${totalChecks} CHECKS PASSED`);
  console.log('================================================================');

  if (checksPassed === totalChecks) {
    process.exitCode = 0;
  } else {
    process.exitCode = 1;
  }
}

verifyAll();
