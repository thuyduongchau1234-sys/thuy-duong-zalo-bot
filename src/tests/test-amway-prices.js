import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';

async function testAmwayPrices() {
  const userId = "test_user_price_query";
  
  // Set greeting step to 3 to talk directly to AI engine without onboarding greetings
  dataStore.setGreetingStep(userId, 3);
  
  const testQueries = [
    "Protein của Amway giá bao nhiêu em?",
    "Cho chị xin giá của Double X loại có khay và không khay nhé."
  ];

  for (const query of testQueries) {
    console.log(`\n========================================`);
    console.log(`❓ USER: "${query}"`);
    console.log(`========================================`);
    try {
      const response = await aiEngine.generateResponse(userId, query);
      console.log(`🤖 AI RESPONSE:\n${response}`);
    } catch (error) {
      console.error(`❌ Error during AI query:`, error);
    }
  }
  process.exit(0);
}

testAmwayPrices();
