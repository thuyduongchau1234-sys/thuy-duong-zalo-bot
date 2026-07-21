import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const contentPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\src\\content.md';
const part2Path = 'c:\\Users\\ABC\\Downloads\\25_bai_viet_Goc_Re_Tam_Tri_clean.txt';
const part3Path = 'c:\\Users\\ABC\\Downloads\\25_bai_viet_Phan_3_Quang_Lao_Hoa_clean.txt';
const part4Path = 'c:\\Users\\ABC\\Downloads\\25_bai_viet_Phan_4_Phuc_Hoi_Tu_Than_clean.txt';

console.log('🔄 Bắt đầu gộp toàn bộ 4 phần của Ebook...');

if (!fs.existsSync(contentPath)) {
  console.error('❌ Không tìm thấy file:', contentPath);
  process.exit(1);
}
if (!fs.existsSync(part2Path)) {
  console.error('❌ Không tìm thấy file Phần 2:', part2Path);
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

const currentContent = fs.readFileSync(contentPath, 'utf8');
const part2 = fs.readFileSync(part2Path, 'utf8');
const part3 = fs.readFileSync(part3Path, 'utf8');
const part4 = fs.readFileSync(part4Path, 'utf8');

// 1. Tìm vị trí của phần chèn "PHẦN 3: LÁ CHẮN TẾ BÀO"
const p3Keyword = 'PHẦN 3: LÁ CHẮN TẾ BÀO';
const p3Index = currentContent.indexOf(p3Keyword);

if (p3Index === -1) {
  console.error('❌ Không tìm thấy vị trí Phần 3 trong content.md hiện tại');
  process.exit(1);
}

// Cắt lấy phần gốc (từ đầu cho tới trước Phần 3)
const baseContent = currentContent.substring(0, p3Index).trim();

// Tìm vị trí của Lời Kết (nằm sau Phần 4 trong file hiện tại)
const keywordLK = 'Trước khi khép lại cuốn sách này';
const lkIndex = currentContent.indexOf(keywordLK);

if (lkIndex === -1) {
  console.error('❌ Không tìm thấy phần Lời Kết trong content.md hiện tại');
  process.exit(1);
}

const lkContent = currentContent.substring(lkIndex).trim();

// 2. Tạo nội dung gộp đầy đủ
let merged = baseContent;

// Thêm Phần 2
merged += '\n\n________________\n\n\n# PHẦN 2: GỐC RỄ TÂM TRÍ – KHI NỘI TÂM LÀN DA LÊN TIẾNG\n\n';
merged += part2.trim();

// Thêm Phần 3
merged += '\n\n________________\n\n\n';
merged += part3.trim();

// Thêm Phần 4
merged += '\n\n________________\n\n\n';
merged += part4.trim();

// Thêm Lời Kết
merged += '\n\n________________\n\n\n';
merged += lkContent;

// 3. Ghi đè vào content.md
fs.writeFileSync(contentPath, merged, 'utf8');
console.log('💾 Đã gộp và lưu content.md hoàn chỉnh (gồm cả Phần 2, 3, 4)!');

// 4. Sinh lại Ebook HTML
console.log('🔄 Đang chạy sinh Ebook HTML mới...');
try {
  execSync('node src/generate-ebook.js', { stdio: 'inherit' });
  console.log('🎉 Đã sinh xong file Ebook HTML Tam_Thong_Duong_Nhan_Ebook.html hoàn chỉnh với cả 4 phần!');
} catch (error) {
  console.error('❌ Lỗi chạy script sinh Ebook:', error.message);
}
