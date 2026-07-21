import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';

async function testTamThongKnowledge() {
  console.log('🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM AI HỎI ĐÁP VỀ TAM THÔNG DƯỠNG NHAN & GIẢI TẮC CƠ...\n');
  const userId = "test_user_tam_thong_query_" + Date.now();
  
  // Thiết lập greeting step = 3 để bỏ qua phần chào hỏi ban đầu, tương tác trực tiếp với AI
  dataStore.setGreetingStep(userId, 3);
  
  const testQueries = [
    "Chị bị bạnh quai hàm, mặt hơi lệch bên trái do thói quen nhai một bên. Em hướng dẫn chị động tác massage hay giải tắc cơ cắn (masseter) bằng tay chi tiết được không?",
    "Fascia là gì và tại sao massage cơ mặt sai cách lại làm cho khuôn mặt chảy xệ hoặc to ra hả em?",
    "Em viết giúp chị một bài viết chia sẻ trên Facebook cá nhân về động tác giải tắc cơ trán để xóa nhăn theo phong cách của chị Thùy Dương nhé."
  ];

  for (const query of testQueries) {
    console.log(`\n========================================`);
    console.log(`❓ KHÁCH HỎI: "${query}"`);
    console.log(`========================================`);
    try {
      const response = await aiEngine.generateResponse(userId, query);
      console.log(`🤖 TRỢ LÝ AI TRẢ LỜI:\n${response}`);
    } catch (error) {
      console.error(`❌ Lỗi truy vấn AI:`, error);
    }
  }
  process.exit(0);
}

testTamThongKnowledge();
