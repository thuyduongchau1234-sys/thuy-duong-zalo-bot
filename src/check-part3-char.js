import fs from 'fs';

const content = fs.readFileSync('src/content.md', 'utf8');
const lines = content.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('PHẦN 3') || line.includes('LÁ CHẮN TẾ BÀO') || line.includes('PHAN 3')) {
    console.log(`Dòng ${idx + 1}: "${line}"`);
    // In ra mã code của các ký tự để xem có ký tự đặc biệt nào không
    const codes = [];
    for (let i = 0; i < line.length; i++) {
      codes.push(line.charCodeAt(i));
    }
    console.log(`Codes: ${codes.slice(0, 30).join(', ')}...`);
  }
});
