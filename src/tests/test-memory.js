// ============================================================
// test-memory.js — Test Giai Đoạn 2: Memory Engine
// ============================================================

import aiEngine from '../ai-engine.js';
import memoryEngine from '../memory-engine.js';
import dataStore from '../data-store.js';
import logger from '../logger.js';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  const testUserId = 'test_user_memory_123';
  
  // Reset conversation and memory for this test user
  logger.info('🧹 Cleaning up old test data...');
  aiEngine.clearHistory(testUserId);
  
  // Mock users database entries
  dataStore.upsertUser(testUserId, 'Chị Ngọc Bích Test');
  dataStore.setGreetingStep(testUserId, 3); // Bypass onboarding greeting

  logger.info('🚀 Step 1: Sending message containing important health/consultation info...');
  const userMsg = 'Em ơi chị Ngọc Bích bị lệch mặt bên phải nửa năm nay rồi, huyết áp đo được là 130/80 ở tay trái và 135/85 ở tay phải, nhịp tim 78. Có cách nào massage hay ăn uống gì đỡ không em?';
  
  logger.info(`Message: "${userMsg}"`);
  
  // Call AI response generator
  const response = await aiEngine.generateResponse(testUserId, userMsg);
  logger.info(`🤖 Response: "${response.substring(0, 150)}..."`);
  
  logger.info('⏳ Waiting for background memory extraction task to complete (10 seconds)...');
  await delay(10000);

  // Retrieve memories
  const userMemories = memoryEngine.getUserMemories(testUserId);
  logger.info('📋 Extracted memories for user:');
  console.log(JSON.stringify(userMemories, null, 2));

  if (userMemories.length > 0) {
    logger.info('✅ SUCCESS: Memory successfully extracted and stored!');
  } else {
    logger.error('❌ FAILURE: No memories were extracted. Please check the API key, model configuration, and logs.');
    return;
  }

  logger.info('🚀 Step 2: Sending a second message to check if memory is injected...');
  const followUpMsg = 'Hôm trước chị hỏi em về tình trạng của chị đó, em khuyên chị làm gì nhỉ?';
  logger.info(`Message: "${followUpMsg}"`);

  // This second call should trigger dynamic system prompt injection with memories!
  const followUpResponse = await aiEngine.generateResponse(testUserId, followUpMsg);
  logger.info(`🤖 Response to follow-up: "${followUpResponse}"`);

  logger.info('🎉 Memory test finished!');
}

runTest().catch(err => {
  console.error('Test crashed with error:', err);
});
