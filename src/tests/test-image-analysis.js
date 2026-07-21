import aiEngine from '../ai-engine.js';

async function testImageAnalysis() {
  console.log('🧪 RUNNING DEEP IMAGE ANALYSIS PROMPT TEST...\n');

  const userId = `test-user-image-analysis-${Date.now()}`;
  const question = 'Phân tích chân mày và môi của bạn khách này giúp chị nhé, xem dáng nào hợp.';
  // Using a public portrait image from Wikimedia (correct path: 8/8d)
  const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg';
  
  console.log(`Question: "${question}"`);
  console.log(`Image URL: "${imageUrl}"`);
  console.log('Waiting for AI response...');
  
  const response = await aiEngine.generateResponse(userId, question, imageUrl);
  
  console.log('\n--- AI RESPONSE ---');
  console.log(response);
  console.log('-------------------\n');

  // Verify mandatory sections are present
  const requiredSections = [
    'ĐÁNH GIÁ TỔNG QUAN',
    'ƯU ĐIỂM',
    'NHƯỢC ĐIỂM',
    'ĐỀ XUẤT DÁNG/MÀU',
    'KỸ THUẬT NÊN THỰC HIỆN',
    'LƯU Ý CHO KỸ THUẬT VIÊN',
    'MỨC ĐỘ TỰ TIN CỦA NHẬN ĐỊNH (%)'
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
    console.log('\n✅ DEEP IMAGE ANALYSIS PROMPT TEST PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ DEEP IMAGE ANALYSIS PROMPT TEST FAILED: Some required sections were missing.');
    process.exit(1);
  }
}

testImageAnalysis().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
