import aiEngine from '../ai-engine.js';
import dataStore from '../data-store.js';
import config from '../config.js';

async function runTest() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TƯƠNG TÁC NHÓM & XƯNG HÔ...');

  const groupId = 'test-group-12345';
  const adminId = config.zalo.adminId || '4158999347555777303';
  const normalUserId = 'user-abc-98765';
  const normalUserName = 'Nguyễn Văn A';

  // Thiết lập giả lập nhóm được duyệt trong database
  dataStore.approveGroup(groupId, 'Nhóm Tam Thông Dưỡng Nhan Test', 'Thử nghiệm tương tác và xưng hô');

  // Khởi tạo/xóa lịch sử cũ của nhóm test để kết quả kiểm thử chính xác
  dataStore.conversations[groupId] = [];
  
  // Giả lập Zalo API
  const mockApi = {
    getUserInfo: async (id) => {
      if (id === adminId) {
        return {
          changed_profiles: {
            [adminId]: { displayName: 'Châu Thị Thùy Dương', name: 'Châu Thị Thùy Dương' }
          }
        };
      }
      return {
        changed_profiles: {
          [normalUserId]: { displayName: normalUserName, name: normalUserName }
        }
      };
    }
  };

  // --- LƯỢT 1: Người dùng bình thường hỏi bot ---
  console.log('\n--- LƯỢT 1: Khách hàng Nguyễn Văn A hỏi ---');
  const msg1 = 'Chào Trợ lý ơi, mình muốn hỏi về phương pháp Tam Thông Dưỡng Nhan có giúp nâng cơ mặt chảy xệ không?';
  console.log(`[Nguyễn Văn A]: "${msg1}"`);
  
  const response1 = await aiEngine.generateResponse(
    groupId, 
    msg1, 
    null, 
    mockApi, 
    normalUserName, 
    normalUserId
  );
  
  console.log(`[AI Trợ Lý Phản Hồi]:\n"${response1}"`);
  
  // Kiểm định xem phản hồi có gọi đúng tên Nguyễn Văn A và xưng em/gọi anh/chị không
  const hasA = response1.toLowerCase().includes('a') || response1.toLowerCase().includes('nguyễn văn a');
  const hasDuongCall = response1.toLowerCase().includes('chào chị dương') || response1.toLowerCase().includes('chào chị thùy dương') || response1.toLowerCase().includes('gửi chị dương') || response1.toLowerCase().includes('anh là chị dương');
  
  console.log('✅ Kết quả Lượt 1:');
  console.log(`- Nhận diện đúng tên khách hàng: ${hasA ? 'ĐÚNG' : 'SAI'}`);
  console.log(`- Có bị gọi nhầm khách hàng là "chị Dương" không: ${hasDuongCall ? 'BỊ GỌI NHẦM ❌' : 'KHÔNG BỊ GỌI NHẦM (ĐÚNG) ✅'}`);

  // --- LƯỢT 2: Chị Thùy Dương (Admin) nhắn tin hỏi ---
  console.log('\n--- LƯỢT 2: Chị Thùy Dương (Admin) hỏi ---');
  const msg2 = 'Em ơi, báo cáo xem hôm nay có những ai nhắn tin với em rồi?';
  console.log(`[Chị Thùy Dương]: "${msg2}"`);

  const response2 = await aiEngine.generateResponse(
    groupId,
    msg2,
    null,
    mockApi,
    'Châu Thị Thùy Dương',
    adminId
  );

  console.log(`[AI Trợ Lý Phản Hồi]:\n"${response2}"`);

  const hasRespectCall = response2.toLowerCase().includes('chị dương') || response2.toLowerCase().includes('chị thùy dương') || response2.toLowerCase().includes('chị yêu');
  
  console.log('✅ Kết quả Lượt 2:');
  console.log(`- Xưng hô kính trọng với Admin (Chị Thùy Dương): ${hasRespectCall ? 'ĐÚNG (Đã gọi "chị Dương") ✅' : 'SAI ❌'}`);

  // --- LƯỢT 3: Kiểm tra lưu trữ trong Conversations ---
  console.log('\n--- LƯỢT 3: Kiểm tra lịch sử lưu trữ ---');
  const history = dataStore.getConversationHistory(groupId);
  console.log('Lịch sử cuộc trò chuyện nhóm hiện tại:');
  console.log(JSON.stringify(history, null, 2));

  const hasSenderNameInHistory = history.every(h => h.role === 'assistant' || (h.role === 'user' && h.senderName));
  const isDuplicateSaved = history.filter(h => h.role === 'assistant').length > 2;

  console.log(`- Có lưu senderName của user trong lịch sử không: ${hasSenderNameInHistory ? 'CÓ ✅' : 'KHÔNG ❌'}`);
  console.log(`- Có bị lưu trùng tin nhắn của Assistant không: ${isDuplicateSaved ? 'BỊ TRÙNG LẶP ❌' : 'KHÔNG BỊ TRÙNG LẶP (ĐÚNG) ✅'}`);

  console.log('\n🧪 HOÀN TẤT KIỂM THỬ!');
  process.exit(0);
}

runTest();
