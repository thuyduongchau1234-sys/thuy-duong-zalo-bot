import aiEngine from '../ai-engine.js';

async function testFaceSculpting() {
  console.log('🧪 RUNNING FACIAL TENSION RELEASE (GIẢI TẮC CƠ) TEST...\n');

  const userId = `test-user-face-${Date.now()}`;
  const question = 'khách này gò má hơi cao và cơ hàm bị căng cứng mỏi cơ, Dương xem có điểm nào đẹp và hướng dẫn cách mát-xa giải tắc cơ giúp chị với.';
  const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8d/President_Barack_Obama.jpg';
  
  console.log(`Question: "${question}"`);
  console.log(`Image URL: "${imageUrl}"`);
  console.log('Waiting for AI response...');
  
  const response = await aiEngine.generateResponse(userId, question, imageUrl);
  
  console.log('\n--- AI RESPONSE ---');
  console.log(response);
  console.log('-------------------\n');

  // Verify recognition and encouragement tone
  console.log('Verifying tone and rules:');
  const includesWelcome = response.toLowerCase().includes('chào') || response.toLowerCase().includes('dương');
  console.log(`- Contains greeting/Dương: ${includesWelcome}`);

  // Let's do a simple check for positive recognition
  const positiveWords = ['sáng', 'đẹp', 'cân đối', 'tự nhiên', 'nổi bật', 'thanh tú', 'hài hòa', 'tốt'];
  const hasPositiveAcknowledge = positiveWords.some(w => response.toLowerCase().includes(w));
  console.log(`- Sincere acknowledgment words found: ${hasPositiveAcknowledge}`);

  // Check if specific massage maneuvers are detailed
  const actionWords = ['miết', 'vuốt', 'ấn', 'huyệt', 'động tác', 'thao tác', 'tay', 'sừng'];
  const hasActions = actionWords.some(w => response.toLowerCase().includes(w));
  console.log(`- Specific actions detailed: ${hasActions}`);

  if (hasPositiveAcknowledge && hasActions) {
    console.log('\n✅ FACIAL TENSION RELEASE TEST PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ FACIAL TENSION RELEASE TEST FAILED: Missing positive acknowledgment or action maneuvers.');
    process.exit(1);
  }
}

testFaceSculpting().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
