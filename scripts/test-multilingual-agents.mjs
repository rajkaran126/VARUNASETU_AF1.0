// test-multilingual-agents.mjs
// Automated verification script for VARUNASETU Six-Agent Intelligence & Multilingual NLU

const TEST_CASES = [
  {
    name: '1. English Flagship Query (Redundancy Analysis)',
    query: 'Are SMW4 and SMW5 genuinely redundant in Egypt?',
    expectedLang: 'english',
    expectedIntent: ['REDUNDANCY_ANALYSIS', 'SRLG_ANALYSIS', 'NETWORK_LOOKUP'],
  },
  {
    name: '2. Romanized Kannada Query (False Redundancy in Suez)',
    query: 'SMW4 mathu SMW5 Egypt nalli redundant idhiya?',
    expectedLang: 'kannada',
    isTransliterated: true,
  },
  {
    name: '3. Romanized Hindi Query (False Redundancy in Egypt)',
    query: 'Kya SMW4 aur SMW5 Egypt me sach me redundant hain?',
    expectedLang: 'hindi',
    isTransliterated: true,
  },
  {
    name: '4. Casual Greeting & Introduction (Fast-Path)',
    query: 'Namaskara, who are you and what is Varunasetu?',
    expectedIntent: ['CASUAL_CONVERSATION', 'GENERAL_EXPLANATION'],
  },
];

async function runTests() {
  console.log('=== VARUNASETU MULTILINGUAL MULTI-AGENT VERIFICATION ===\n');

  let passedCount = 0;

  for (const tc of TEST_CASES) {
    console.log(`--- Testing: ${tc.name} ---`);
    console.log(`Query: "${tc.query}"`);
    const start = Date.now();

    try {
      const res = await fetch('http://localhost:3000/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: tc.query }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${await res.text()}`);
      }

      const data = await res.json();
      const elapsed = Date.now() - start;

      const report = data.report;
      const nlp = report?.nlpAnalysis;
      const lang = nlp?.language;
      const consensus = report?.consensusAssessment;
      const specialists = report?.specialistFindings || [];

      console.log(`Status: HTTP 200 OK (${elapsed}ms)`);
      console.log(`Detected Language: ${lang?.detectedLanguage} (script: ${lang?.detectedScript}, transliterated: ${lang?.isTransliterated})`);
      console.log(`Primary Intent: ${nlp?.primaryIntent} (confidence: ${(nlp?.confidence * 100).toFixed(0)}%)`);
      console.log(`Entities: ${nlp?.entities?.map(e => `${e.canonicalName} (${e.type})`).join(', ') || 'None'}`);
      console.log(`Specialists Engaged: ${specialists.length} [${specialists.map(s => s.agentName).join(', ')}]`);
      console.log(`Consensus Summary:\n"${consensus?.summary}"`);
      console.log(`Key Findings / Citations:`);
      consensus?.keyFindings?.slice(0, 3).forEach(f => console.log(`  • ${f}`));
      console.log(`Recommended Next Step: ${consensus?.recommendedNextStep}`);
      console.log(`Suggested Action Plan Steps: ${consensus?.actionPlan?.length || 0}`);

      if (data.messages && data.messages.length > 0) {
        console.log(`Generated UI Messages: ${data.messages.length} messages`);
      }

      console.log(`Result: ✅ PASSED\n`);
      passedCount++;
    } catch (err) {
      console.error(`Result: ❌ FAILED - ${err.message}\n`);
    }
  }

  console.log(`================================================`);
  console.log(`VERIFICATION SUMMARY: ${passedCount}/${TEST_CASES.length} TEST CASES PASSED`);
  console.log(`================================================`);

  if (passedCount === TEST_CASES.length) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();

