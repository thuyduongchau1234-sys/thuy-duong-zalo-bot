import fs from 'fs';

const messagesPath = 'data/messages.json';
const convPath = 'data/conversations.json';

console.log('🔄 Đọc tin nhắn mới nhận gần đây...');

if (fs.existsSync(messagesPath)) {
  const content = fs.readFileSync(messagesPath, 'utf8');
  try {
    const msgs = JSON.parse(content);
    console.log(`\n--- MESSAGES.JSON (Tổng số: ${msgs.length || 0}) ---`);
    if (Array.isArray(msgs)) {
      const recent = msgs.slice(-15);
      recent.forEach((m, idx) => {
        console.log(`[${idx + 1}] User: ${m.userId || m.senderId}, Role: ${m.role}, Content: ${JSON.stringify(m.content || '')}`);
      });
    } else {
      console.log('Dữ liệu không phải mảng:', typeof msgs);
    }
  } catch (e) {
    console.error('Lỗi parse messages.json:', e.message);
  }
}

if (fs.existsSync(convPath)) {
  const content = fs.readFileSync(convPath, 'utf8');
  try {
    const conv = JSON.parse(content);
    console.log(`\n--- CONVERSATIONS.JSON ---`);
    console.log(JSON.stringify(conv, null, 2).substring(0, 1000));
  } catch (e) {
    console.error('Lỗi parse conversations.json:', e.message);
  }
}
