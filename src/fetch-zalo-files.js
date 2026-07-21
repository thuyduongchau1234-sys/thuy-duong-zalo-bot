import { Zalo } from 'zca-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import axios from 'axios';

const credPath = './zalo-credentials.json';
console.log('🚀 Bắt đầu quét lịch sử nhóm Zalo tìm file giải đáp...');

if (!existsSync(credPath)) {
  console.error('❌ Không tìm thấy credentials');
  process.exit(1);
}

const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
const zalo = new Zalo({ selfListen: true });

async function run() {
  const api = await zalo.login({
    cookie: credentials.cookies,
    imei: credentials.imei,
    userAgent: credentials.userAgent,
  });
  console.log('✅ Đăng nhập Zalo thành công!');

  const groupIds = [
    '8596083334958647787', // Đạo Phật Khoa Học Thiền Tông
    '5046923348046707114', // Thực Hành Tam Thông Dưỡng Nhan
    '5984264378532620972', // Làm Chủ AI- Nâng Tầm Phiên Bản
  ];

  for (const gid of groupIds) {
    console.log(`\n--- Quét lịch sử nhóm: ${gid} ---`);
    try {
      // Lấy 100 tin nhắn gần nhất
      const history = await api.getGroupChatHistory(gid, 150);
      const msgs = history.groupMsgs || [];
      console.log(`Tìm thấy ${msgs.length} tin nhắn.`);

      for (const msg of msgs) {
        const cleanMsg = msg.message || '';
        const senderId = msg.uid || '';
        const timestamp = msg.time || '';
        
        // In ra các tin nhắn chứa từ khóa hoặc file đính kèm
        const hasKeyword = cleanMsg.toLowerCase().includes('lâm') || 
                           cleanMsg.toLowerCase().includes('56') || 
                           cleanMsg.toLowerCase().includes('file') || 
                           cleanMsg.toLowerCase().includes('đáp');
                           
        const hasAttachment = msg.attachments && msg.attachments.length > 0;

        if (hasKeyword || hasAttachment) {
          console.log(`[${timestamp}] Sender: ${senderId}`);
          if (cleanMsg) console.log(`  Content: ${cleanMsg}`);
          
          if (hasAttachment) {
            console.log('  Attachments:', JSON.stringify(msg.attachments, null, 2));
            // Thử tải file đính kèm nếu đó là file docx hoặc pdf hoặc hình ảnh
            for (const att of msg.attachments) {
              if (att.url || att.thumbUrl || att.href) {
                const fileUrl = att.url || att.href;
                const fileName = att.name || att.fileName || `file_${Date.now()}`;
                console.log(`  -> Tìm thấy file: ${fileName} tại URL: ${fileUrl}`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`❌ Lỗi quét nhóm ${gid}:`, e.message);
    }
  }
  process.exit(0);
}

run().catch(console.error);
