import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';

async function testSpaPrices() {
  console.log('🧪 BẮT ĐẦU CHẠY THỬ NGHIỆM AI HỎI ĐÁP BẢNG GIÁ SPA THÙY DƯƠNG...\n');
  const userId = "test_user_spa_price_query_" + Date.now();
  
  // Thiết lập greeting step = 3 để bỏ qua phần chào hỏi ban đầu, tương tác trực tiếp với AI
  dataStore.setGreetingStep(userId, 3);
  
  const testQueries = [
    "Spa bên mình có dịch vụ phun mày và phun môi không em? Giá rổ thế nào?",
    "Gói gội đầu An Yên với Tỉnh Thức khác nhau thế nào và giá bao nhiêu ạ?",
    "Liệu trình Tam Thông Dưỡng Nhan cơ bản giá bao nhiêu và làm trong bao lâu?",
    "Triệt nách bên mình giá lẻ bao nhiêu em? Có gói 5 lần hay 10 lần không?"
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

testSpaPrices();
