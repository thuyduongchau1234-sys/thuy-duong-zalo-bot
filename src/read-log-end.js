import fs from 'fs';

const logPath = 'logs/combined1.log';

console.log('🔄 Đọc 100 dòng cuối của:', logPath);

if (!fs.existsSync(logPath)) {
  console.error('❌ Không tìm thấy file log');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n').filter(l => l.trim() !== '');

const lastLines = lines.slice(-100);

lastLines.forEach((line, idx) => {
  try {
    const logObj = JSON.parse(line);
    // Decode unicode escape trong logObj
    const decodedMsg = logObj.message;
    console.log(`[${logObj.timestamp}] [${logObj.level}] ${decodedMsg}`, logObj.meta || '');
  } catch (e) {
    // Nếu không phải JSON, in trực tiếp
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
