import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const contentPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\src\\content.md';
const part3Path = 'c:\\Users\\ABC\\Downloads\\Văn bản đã dán (1)(4).txt';
const part4Path = 'c:\\Users\\ABC\\Downloads\\Phan_4_utf8_node.txt';

console.log('🔄 Bắt đầu gộp tài liệu...');

if (!fs.existsSync(contentPath)) {
  console.error('❌ Không tìm thấy file:', contentPath);
  process.exit(1);
}
if (!fs.existsSync(part3Path)) {
  console.error('❌ Không tìm thấy file Phần 3:', part3Path);
  process.exit(1);
}
if (!fs.existsSync(part4Path)) {
  console.error('❌ Không tìm thấy file Phần 4:', part4Path);
  process.exit(1);
}

const content = fs.readFileSync(contentPath, 'utf8');
const part3 = fs.readFileSync(part3Path, 'utf8');
const part4 = fs.readFileSync(part4Path, 'utf8');

// Tìm vị trí của phần Lời Kết
const keyword = 'Trước khi khép lại cuốn sách này';
const index = content.indexOf(keyword);

if (index === -1) {
  console.error('❌ Không tìm thấy phần Lời Kết trong content.md');
  process.exit(1);
}

// Cắt lấy phần đầu (trước Lời Kết)
const beforeText = content.substring(0, index).trim();
const afterText = content.substring(index).trim();

// Tạo nội dung gộp
let newContent = beforeText;
newContent += '\n\n________________\n\n\n';
newContent += part3.trim();
newContent += '\n\n________________\n\n\n';
newContent += part4.trim();
newContent += '\n\n________________\n\n\n';
newContent += afterText;

fs.writeFileSync(contentPath, newContent, 'utf8');
console.log('💾 Đã gộp thành công và lưu vào: ' + contentPath);

// Chạy generate-ebook.js để cập nhật Ebook HTML
console.log('🔄 Đang chạy script sinh Ebook HTML...');
try {
  execSync('node src/generate-ebook.js', { stdio: 'inherit' });
  console.log('🎉 Đã cập nhật thành công file Ebook HTML!');
} catch (error) {
  console.error('❌ Lỗi chạy script sinh Ebook:', error.message);
}
