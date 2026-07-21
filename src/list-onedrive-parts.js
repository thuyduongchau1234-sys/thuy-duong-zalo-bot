import fs from 'fs';

const filePath = 'c:\\Users\\ABC\\OneDrive\\PHẦN 20 GIẢI ĐÁP THIỀN TÔNG ĐẶC BIỆT_clean.txt';

if (!fs.existsSync(filePath)) {
  console.error('❌ Không tìm thấy file:', filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('🔍 Danh sách các tiêu đề Phần trong file OneDrive:');

lines.forEach((line, idx) => {
  const clean = line.trim();
  if (/^phần\s+\d+/i.test(clean) || /^câu hỏi của/i.test(clean) || clean.includes('GIẢI ĐÁP THIỀN TÔNG')) {
    console.log(`Dòng ${idx + 1}: ${clean}`);
  }
});
