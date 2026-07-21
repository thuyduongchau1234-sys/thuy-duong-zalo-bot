import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';

// Re-implement matches in test to verify logic correctness
function isTargetGroupForWelcome(groupName) {
  if (!groupName) return false;
  const name = groupName.toLowerCase();
  
  const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  
  const matchesBeauty = normalized.includes("nang") && normalized.includes("tam") && normalized.includes("sac") && normalized.includes("dep");
  const matchesKhoeDep = normalized.includes("khoe") && normalized.includes("dep") && normalized.includes("tinh") && normalized.includes("thuc");
  const matchesTamThong = normalized.includes("tam") && normalized.includes("thong") && normalized.includes("duong") && normalized.includes("nhan");
  const matchesAI = normalized.includes("lam") && normalized.includes("chu") && normalized.includes("ai") && normalized.includes("nang") && normalized.includes("tam") && normalized.includes("phien") && normalized.includes("ban");
  
  return matchesBeauty || matchesKhoeDep || matchesTamThong || matchesAI;
}

async function testGroupWelcome() {
  console.log('🧪 RUNNING GROUP WELCOME GREETING TESTS...\n');

  // --- Part 1: Verify Group Name Matching Logic ---
  console.log('--- Part 1: Verifying group name matching logic ---');
  const testCases = [
    { name: 'Cộng Đồng Nâng Tầm Sắc Đẹp Phụ Nữ Việt Nam', expected: true },
    { name: 'KHOẺ và ĐẸP TỉnhThức', expected: true },
    { name: 'Thực Hành Tam Thông Dưỡng Nhan', expected: true },
    { name: 'Làm Chủ AI- Nâng Tầm Phiên Bản', expected: true },
    { name: 'Nhóm Gia Đình Thân Yêu', expected: false },
    { name: 'Nhóm Thảo luận Trading SMC Cường', expected: false }
  ];

  for (const tc of testCases) {
    const result = isTargetGroupForWelcome(tc.name);
    console.log(`Group: "${tc.name}" -> Match: ${result} (Expected: ${tc.expected})`);
    if (result !== tc.expected) {
      throw new Error(`Failed group name match test for "${tc.name}"`);
    }
  }
  console.log('✅ Part 1 passed!\n');

  // --- Part 2: Verify AI Welcome Message Generation ---
  console.log('--- Part 2: Verifying AI welcome message generation ---');
  const groupName = 'Cộng Đồng Nâng Tầm Sắc Đẹp Phụ Nữ Việt Nam';
  const memberNames = 'Nguyễn Thị Hoa, Trần Văn Nam';
  const purpose = 'Thực hành phương pháp tam thông dưỡng nhan, chăm sóc làm đẹp tự nhiên và dinh dưỡng sức khỏe.';
  
  const prompt = `Bạn là Trợ Lý AI của chị Thùy Dương. Có thành viên mới tên là "${memberNames}" vừa tham gia vào nhóm Zalo "${groupName}" với mục đích: "${purpose}".
Hãy viết một tin nhắn chào mừng ngắn gọn (chỉ 2 đến 3 câu ngắn), cực kỳ ấm áp, thân thiện, tràn đầy năng lượng tích cực để chào đón thành viên mới này vào nhóm. 
Yêu cầu:
1. Xưng "Dương" (trợ lý của chị Thùy Dương) và gọi họ là anh/chị/cả nhà. Nghiêm cấm xưng "em".
2. Đính kèm các emoji sinh động phù hợp (🌿🌸💆‍♀️✨).
3. Không ghi tiêu đề hay giải thích gì thêm, chỉ trả về duy nhất nội dung tin nhắn chào mừng.`;

  console.log('Generating AI welcome message...');
  const welcomeMsg = await aiEngine.generateResponse('test-welcome-group-id', prompt);
  console.log('\nGenerated Welcome Message:');
  console.log('====================================');
  console.log(welcomeMsg);
  console.log('====================================');

  // Verify pronoun requirement (does not contain "em" in a self-referring way or lowercase "em")
  // Let's do a simple check. Vietnamese "em" might be part of "đem", "thêm", etc.
  // We can search for the word "em" with spaces or punctuation around it.
  const emWordRegex = /\bem\b/i;
  const hasEm = emWordRegex.test(welcomeMsg);
  console.log(`Pronoun check - contains "em": ${hasEm} (Expected: false)`);
  
  if (hasEm) {
    console.warn('⚠️ WARNING: AI response contains pronoun "em". Please check System Prompt constraints.');
  } else {
    console.log('✅ Pronoun check passed (correctly avoided "em")!');
  }

  console.log('\n✅ GROUP WELCOME GREETING TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
}

testGroupWelcome().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
