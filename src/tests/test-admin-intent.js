// ============================================================
// test-admin-intent.js — Kiểm thử Nhận diện Ý định của Admin
// ============================================================

import dataStore from '../data-store.js';
import memoryEngine from '../memory-engine.js';
import AIEngine from '../ai-engine.js';
import config from '../config.js';
import logger from '../logger.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';

async function runTests() {
  logger.info('🧪 KHỞI CHẠY KIỂM THỬ NHẬN DIỆN Ý ĐỊNH CỦA ADMIN...');

  const adminId = config.zalo.adminId;
  const testUserId = 'test_user_tuyet_12345';
  const testUserName = 'Chị Tuyết';

  // 1. Mock dữ liệu khách hàng trong dataStore
  dataStore.upsertUser(testUserId, testUserName);
  
  // 2. Mock Trí nhớ dài hạn của chị Tuyết
  const testMemory = {
    id: 'mem_tuyet_test',
    userId: testUserId,
    userName: testUserName,
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    subject: 'Liệu trình đả thông cơ gò má',
    summary: 'Chị Tuyết đang thực hiện liệu trình Tam Thông Dưỡng Nhan đả thông rãnh cười sâu. Da chị Tuyết hơi nhạy cảm nhẹ ở má trái.',
    keywords: ['rãnh cười', 'gò má'],
    nextAction: 'Lưu ý massage hướng nâng nhẹ nhàng bên má trái'
  };
  
  // Ghi đè hoặc thêm vào file lưu trữ trí nhớ của khách hàng
  const customersFile = './data/memory/customers.json';
  let customers = [];
  try {
    if (existsSync(customersFile)) {
      customers = JSON.parse(readFileSync(customersFile, 'utf8') || '[]');
    }
  } catch (e) {}
  customers = customers.filter(m => m.userId !== testUserId);
  customers.push(testMemory);
  writeFileSync(customersFile, JSON.stringify(customers, null, 2));

  // 3. Mock lịch nhắc nhở CRM của chị Tuyết
  const remindersFile = './data/reminders.json';
  let reminders = [];
  try {
    if (existsSync(remindersFile)) {
      reminders = JSON.parse(readFileSync(remindersFile, 'utf8') || '[]');
    }
  } catch (e) {}

  const todayStr = new Date().toISOString().split('T')[0];
  const testReminder = {
    id: 'rem_tuyet_test_123',
    userId: testUserId,
    userName: testUserName,
    createdDate: todayStr,
    targetDate: todayStr,
    reason: 'Đắp mặt nạ thảo dược phục hồi má trái và kiểm tra rãnh cười xem có bớt căng tức không.',
    status: 'pending'
  };

  reminders = reminders.filter(r => r.id !== testReminder.id);
  reminders.push(testReminder);
  writeFileSync(remindersFile, JSON.stringify(reminders, null, 2));

  // 4. Khởi tạo AI Engine
  const aiEngine = AIEngine;

  // ==========================================
  // KỊCH BẢN 1: Admin hỏi lịch trình của chị Tuyết hôm nay
  // ==========================================
  const query1 = 'Ok tạm ổn . Chii chuẩn bị chăm sóc da cho chị Tuyết em hãy nhắc lại là cần làm gì hôm nay cho chị Tuyết nha';
  logger.info(`\n========================================\n❓ ADMIN HỎI 1: "${query1}"\n========================================`);
  
  const response1 = await aiEngine.generateResponse(adminId, query1, 'Châu Thị Thùy Dương', []);
  logger.info(`\n🤖 TRỢ LÝ AI TRẢ LỜI 1:\n${response1}\n`);

  // ==========================================
  // KỊCH BẢN 2: Admin yêu cầu xuất báo cáo chung từ nhật ký chat
  // ==========================================
  const query2 = 'báo cáo tin nhắn hôm nay';
  logger.info(`\n========================================\n❓ ADMIN HỎI 2: "${query2}"\n========================================`);
  
  const response2 = await aiEngine.generateResponse(adminId, query2, 'Châu Thị Thùy Dương', []);
  logger.info(`\n🤖 TRỢ LÝ AI TRẢ LỜI 2:\n${response2}\n`);

  // ==========================================
  // KỊCH BẢN 3: Admin yêu cầu tạo nhắc nhở CRM mới
  // ==========================================
  const query3 = 'hẹn lịch chăm sóc chị Lan sau 3 ngày nhé';
  logger.info(`\n========================================\n❓ ADMIN HỎI 3: "${query3}"\n========================================`);
  
  const response3 = await aiEngine.generateResponse(adminId, query3, 'Châu Thị Thùy Dương', []);
  logger.info(`\n🤖 TRỢ LÝ AI TRẢ LỜI 3:\n${response3}\n`);

  logger.info('🧪 HOÀN TẤT KIỂM THỬ NHẬN DIỆN Ý ĐỊNH ADMIN.');
}

runTests().catch(err => {
  logger.error('❌ Lỗi chạy kiểm thử', err);
});
