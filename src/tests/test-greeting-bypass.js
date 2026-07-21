import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';

async function runTests() {
  console.log('🧪 RUNNING GREETING BYPASS TESTS...\n');

  // --- Scenario 1: Standard Sequential Greeting ---
  console.log('--- Scenario 1: Standard sequential greeting ---');
  const user1 = `test-user-g1-${Date.now()}`;
  
  const r1 = await aiEngine.generateResponse(user1, 'chào em');
  console.log(`Msg 1 ('chào em') response:`);
  console.log(r1);
  const step1 = dataStore.getUser(user1)?.greetingStep;
  console.log(`User step after Msg 1: ${step1} (Expected: 1)`);
  if (step1 !== 1) throw new Error('Failed Scenario 1 - Msg 1');

  const r2 = await aiEngine.generateResponse(user1, 'hi');
  console.log(`\nMsg 2 ('hi') response:`);
  console.log(r2);
  const step2 = dataStore.getUser(user1)?.greetingStep;
  console.log(`User step after Msg 2: ${step2} (Expected: 2)`);
  if (step2 !== 2) throw new Error('Failed Scenario 1 - Msg 2');

  const r3 = await aiEngine.generateResponse(user1, 'ok');
  console.log(`\nMsg 3 ('ok') response:`);
  console.log(r3);
  const step3 = dataStore.getUser(user1)?.greetingStep;
  console.log(`User step after Msg 3: ${step3} (Expected: 3)`);
  if (step3 !== 3) throw new Error('Failed Scenario 1 - Msg 3');

  // --- Scenario 2: Bypassing with a question/keyword ---
  console.log('\n--- Scenario 2: Bypassing with a question/keyword ---');
  const user2 = `test-user-g2-${Date.now()}`;
  
  // We expect this message to trigger the bypass.
  // Note: Since it bypasses, it will call Gemini or OpenAI. If API keys are set, it will reply using AI.
  // If API keys are missing/invalid, it will call fallback response.
  // Either way, we can check that it DOES NOT return the greeting1 text, and greetingStep is set to 3.
  const r4 = await aiEngine.generateResponse(user2, 'chào em, tư vấn giúp chị cách điêu khắc mặt bằng sừng nha');
  console.log(`Response for question:`);
  console.log(r4);
  const step4 = dataStore.getUser(user2)?.greetingStep;
  console.log(`User step after question: ${step4} (Expected: 3)`);
  if (step4 !== 3) throw new Error('Failed Scenario 2');
  if (r4.includes('Chào anh/chị,\nEm là trợ lý')) throw new Error('Failed Scenario 2: Returned greeting 1 instead of AI/fallback response');

  // --- Scenario 3: Bypassing with an image ---
  console.log('\n--- Scenario 3: Bypassing with an image ---');
  const user3 = `test-user-g3-${Date.now()}`;
  
  // We send an image with no message text.
  // It should bypass greetings and go to AI/fallback.
  const r5 = await aiEngine.generateResponse(user3, '', 'https://example.com/image.jpg');
  console.log(`Response for image:`);
  console.log(r5);
  const step5 = dataStore.getUser(user3)?.greetingStep;
  console.log(`User step after image: ${step5} (Expected: 3)`);
  if (step5 !== 3) throw new Error('Failed Scenario 3');
  if (r5.includes('Chào anh/chị,\nEm là trợ lý')) throw new Error('Failed Scenario 3: Returned greeting 1 instead of AI/fallback response');

  console.log('\n✅ ALL GREETING BYPASS TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
