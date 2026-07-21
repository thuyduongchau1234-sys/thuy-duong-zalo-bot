import fs from 'fs';
import { execSync } from 'child_process';

const contentPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\src\\content.md';

console.log('🔄 Bắt đầu sửa lỗi chèn thiếu tiêu đề Phần 3 trong content.md...');

if (!fs.existsSync(contentPath)) {
  console.error('❌ Không tìm thấy content.md');
  process.exit(1);
}

let content = fs.readFileSync(contentPath, 'utf8');

// Tìm vị trí dòng bắt đầu bằng BÀI 51 hoặc chứa bài 51 đầu tiên ở cuối file
// Thường thì nó bắt đầu bằng "BÀI 51" hoặc "BÃ€I 51" do encoding
const p3Regex = /(\r?\n)(B[ÀÃ][I]\s*51\s*[-—–])/gi;

if (content.match(p3Regex)) {
  console.log('✅ Tìm thấy vị trí của Bài 51');
  
  // Thực hiện thay thế chèn tiêu đề Chương 8 lên trước Bài 51
  content = content.replace(p3Regex, (match, p1, p2) => {
    return `${p1}CHƯƠNG 8\r\nPHẦN 3: LÁ CHẮN TẾ BÀO – ĐỐI ĐẦU VỚI QUANG LÃO HÓA VÀ GỐC TỰ DO\r\n\r\n${p2}`;
  });
  
  fs.writeFileSync(contentPath, content, 'utf8');
  console.log('💾 Đã lưu content.md với tiêu đề Chương 8!');
  
  // Chạy generate-ebook.js để cập nhật Ebook HTML
  console.log('🔄 Đang chạy script sinh Ebook HTML...');
  try {
    execSync('node src/generate-ebook.js', { stdio: 'inherit' });
    console.log('🎉 Đã cập nhật thành công file Ebook HTML với Mục Lục đầy đủ 9 Chương!');
  } catch (error) {
    console.error('❌ Lỗi chạy script sinh Ebook:', error.message);
  }
} else {
  console.error('❌ Không tìm thấy tiêu đề BÀI 51 trong file content.md');
}
