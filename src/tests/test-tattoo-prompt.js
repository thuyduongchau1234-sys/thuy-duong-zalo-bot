import aiEngine from '../ai-engine.js';

async function testTattooPrompt() {
  console.log('🧪 RUNNING TATTOO PROMPT TEST...\n');

  const userId = `test-user-tattoo-${Date.now()}`;
  const question = 'làm sao để xử lý chân mày bị trổ đỏ hả em? chị dùng kim gì và đi màu gì để xử lý?';
  
  console.log(`Question: "${question}"`);
  console.log('Waiting for AI response...');
  
  const response = await aiEngine.generateResponse(userId, question);
  
  console.log('\n--- AI RESPONSE ---');
  console.log(response);
  console.log('-------------------\n');

  // Verify mandatory sections are present
  const requiredSections = [
    'TÓM TẮT NHANH',
    'NGUYÊN NHÂN',
    'GIẢI PHÁP THỰC CHIẾN',
    'CÁC LỖI THƯỜNG GẶP',
    'KHUYẾN NGHỊ CỦA CHUYÊN GIA'
  ];

  let allSectionsPresent = true;
  for (const section of requiredSections) {
    if (!response.includes(section)) {
      console.warn(`⚠️ Missing section: ${section}`);
      allSectionsPresent = false;
    } else {
      console.log(`✅ Found section: ${section}`);
    }
  }

  if (allSectionsPresent) {
    console.log('\n✅ TATTOO PROMPT TEST PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ TATTOO PROMPT TEST FAILED: Some required sections were missing.');
    process.exit(1);
  }
}

testTattooPrompt().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
