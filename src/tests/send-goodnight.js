// ============================================================
// send-goodnight.js — Gửi lời chúc ngủ ngon & dưỡng da đến các nhóm
// ============================================================
import { Zalo, ThreadType } from 'zca-js';
import { readFileSync, existsSync } from 'fs';
import config from '../config.js';

async function sendGoodnight() {
  const credPath = config.zalo.credentialsPath;
  if (!existsSync(credPath)) {
    console.error('❌ File credentials không tồn tại!');
    return;
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  console.log('🔌 Đang kết nối Zalo...');
  const zalo = new Zalo({ selfListen: true });
  
  try {
    const api = await zalo.login({
      cookie: credentials.cookies,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
    });
    console.log('✅ Đã đăng nhập thành công!');
    
    // Đọc danh sách nhóm từ data/approved_groups.json
    const approvedGroupsPath = './data/approved_groups.json';
    if (!existsSync(approvedGroupsPath)) {
      console.error('❌ Không tìm thấy file data/approved_groups.json');
      return;
    }
    
    const groups = JSON.parse(readFileSync(approvedGroupsPath, 'utf-8'));
    console.log(`📋 Tìm thấy ${groups.length} nhóm đã duyệt.`);
    
    const msg = `🌙✨ [Chúc ngủ ngon & Dưỡng nhan] Chào cả nhà mình yêu thương! 🌿💆‍♀️\n\n` +
      `Sau một ngày dài bận rộn, trước khi chìm vào giấc ngủ sâu, cả nhà mình hãy cùng em dành ra 1 phút để hít thở sâu, thả lỏng toàn bộ cơ thể và đặc biệt là giãn mềm, thả lỏng toàn bộ cơ mặt nhé.\n\n` +
      `Sự thả lỏng hoàn toàn khi ngủ chính là "bí quyết vàng" giúp khí huyết lưu thông tốt nhất, đưa dưỡng chất đến từng tế bào da, hỗ trợ giảm nếp nhăn và tái tạo làn da căng bóng tự nhiên đấy ạ!\n\n` +
      `Chúc cả nhà có một giấc ngủ thật ngon, hít sâu thở nhẹ, và thức dậy với một làn da tươi tắn, rạng rỡ vào sáng mai nhé! 🌸💤\n\n` +
      `Biết ơn cả nhà mình! 💖`;

    for (const group of groups) {
      console.log(`💬 Đang gửi lời chúc ngủ ngon tới nhóm: ${group.name} (${group.id})...`);
      try {
        await api.sendMessage(msg, group.id, ThreadType.Group);
        console.log(`✅ Đã gửi thành công tới nhóm: ${group.name}`);
      } catch (err) {
        console.error(`❌ Lỗi khi gửi tới nhóm ${group.name}:`, err.message);
      }
      
      // Delay 2 giây giữa các nhóm để tránh spam hoặc bị giới hạn
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('🎉 ĐÃ GỬI LỜI CHÚC NGỦ NGON TỚI TẤT CẢ CÁC NHÓM THÀNH CÔNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ ĐĂNG NHẬP HOẶC GỬI TIN NHẮN THẤT BẠI:', err.message);
    process.exit(1);
  }
}

sendGoodnight();
