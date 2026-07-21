import fs from 'fs';
import path from 'path';

const logsDir = 'C:\\Users\\ABC\\.gemini\\antigravity-ide\\brain\\cf3c0c57-2406-4cbb-8977-d08e7ab0cb1d\\.system_generated\\logs';
const transcriptFull = path.join(logsDir, 'transcript_full.jsonl');
const transcriptNormal = path.join(logsDir, 'transcript.jsonl');

console.log('🔄 Bắt đầu trích xuất prompt đầy đủ của user...');

function checkFile(filePath) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ Tìm thấy file: ${filePath}`);
    const stats = fs.statSync(filePath);
    console.log(`   Kích thước: ${stats.size} bytes`);
    return true;
  } else {
    console.log(`❌ Không tìm thấy: ${filePath}`);
    return false;
  }
}

if (!checkFile(transcriptFull) && !checkFile(transcriptNormal)) {
  console.error('❌ Cả hai file đều không tồn tại!');
  process.exit(1);
}

const targetFile = fs.existsSync(transcriptFull) ? transcriptFull : transcriptNormal;

try {
  const content = fs.readFileSync(targetFile, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() !== '');
  console.log(`Tổng số dòng trong transcript: ${lines.length}`);
  
  // Dòng cuối cùng chứa tool_calls hoặc prompt của user vừa gửi
  // Ta sẽ quét ngược từ cuối lên để tìm dòng chứa type "USER_INPUT"
  let userPrompt = null;
  for (let i = lines.length - 1; i >= 0; i--) {
    const obj = JSON.parse(lines[i]);
    if (obj.type === 'USER_INPUT') {
      userPrompt = obj.content;
      console.log(`✅ Tìm thấy USER_INPUT tại dòng thứ ${i + 1}`);
      break;
    }
  }
  
  if (userPrompt) {
    console.log(`Độ dài prompt trích xuất được: ${userPrompt.length} ký tự`);
    // Ghi ra file tạm để lưu trữ
    fs.writeFileSync('data/full_user_prompt.txt', userPrompt, 'utf8');
    console.log('💾 Đã lưu prompt đầy đủ vào data/full_user_prompt.txt');
    
    // In ra 200 ký tự cuối để kiểm tra xem có bị cụt không
    console.log('\n--- 200 ký tự cuối của prompt ---');
    console.log(userPrompt.substring(userPrompt.length - 200));
  } else {
    console.error('❌ Không tìm thấy dòng USER_INPUT nào!');
  }
} catch (err) {
  console.error('❌ Lỗi xử lý:', err.message);
}
