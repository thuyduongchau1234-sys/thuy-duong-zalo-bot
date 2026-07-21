// ============================================================
// approve-group-direct.js — Duyệt nhóm và gửi lời chào trực tiếp
// ============================================================
import { Zalo, ThreadType } from 'zca-js';
import { readFileSync, existsSync } from 'fs';
import config from '../config.js';
import dataStore from '../data-store.js';

async function runDirectApproval() {
  const targetGroupId = '1631611445982365444';
  const groupName = 'Tinh hoa nhân hiệu';
  const purpose = 'Thực hành phương pháp tam thông dưỡng nhan, chăm sóc làm đẹp tự nhiên và dinh dưỡng sức khỏe.';

  console.log('📦 1. Đang lưu thông tin duyệt nhóm vào database...');
  dataStore.approveGroup(targetGroupId, groupName, purpose);
  dataStore.upsertUser(targetGroupId, groupName);
  dataStore.setGreetingStep(targetGroupId, 1);
  console.log('✅ Đã lưu vào database thành công!');

  console.log('🔌 2. Đang kết nối Zalo để gửi lời chào trực tiếp...');
  const credPath = config.zalo.credentialsPath;
  if (!existsSync(credPath)) {
    console.error('❌ File credentials không tồn tại!');
    return;
  }

  const credentials = JSON.parse(readFileSync(credPath, 'utf-8'));
  const zalo = new Zalo({ selfListen: false });

  try {
    const api = await zalo.login({
      cookie: credentials.cookies,
      imei: credentials.imei,
      userAgent: credentials.userAgent,
    });
    console.log('✅ Đăng nhập thành công!');

    const welcomeMsg = `Chào cả nhà,\nEm là trợ lý của chị Thùy Dương 🌿\nRất vui được đồng hành cùng cả nhà trong nhóm Tinh hoa nhân hiệu ạ! Chúc cả nhà mình thực hành tam thông dưỡng nhan thật hiệu quả! 🌸💆‍♀️✨`;
    console.log(`💬 Đang gửi lời chào vào nhóm "${groupName}" (${targetGroupId})...`);
    
    await api.sendMessage(welcomeMsg, targetGroupId, ThreadType.Group);
    dataStore.logMessage(targetGroupId, 'outgoing', welcomeMsg);
    dataStore.addToConversation(targetGroupId, 'assistant', welcomeMsg);
    
    console.log('✅ GỬI LỜI CHÀO THÀNH CÔNG!');
  } catch (err) {
    console.error('❌ Gửi lời chào thất bại:', err.message);
  } finally {
    dataStore.close();
    process.exit(0);
  }
}

runDirectApproval();
