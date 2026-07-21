import fs from 'fs';
import { execSync } from 'child_process';

const contentPath = 'c:\\Users\\ABC\\Desktop\\Zalo_AI_Assistant_Setup\\src\\content.md';

console.log('🔄 Bắt đầu sửa đổi tiêu đề trong content.md để tương thích với parser...');

if (!fs.existsSync(contentPath)) {
  console.error('❌ Không tìm thấy content.md');
  process.exit(1);
}

let content = fs.readFileSync(contentPath, 'utf8');

// Định dạng lại các tiêu đề phần 2, 3, 4 thành dạng CHƯƠNG để parser nhận diện được làm Chương mới trong mục lục
// Chúng ta dùng các đoạn text ngắn hơn để tránh sai khác dấu gạch ngang (-, –, —)
let modified = false;

// 1. Phần 2
if (content.includes('PHẦN 2: GỐC RỄ TÂM TRÍ') && !content.includes('CHƯƠNG 7\r\nPHẦN 2: GỐC RỄ TÂM TRÍ') && !content.includes('CHƯƠNG 7\nPHẦN 2: GỐC RỄ TÂM TRÍ')) {
  // Thay thế dòng chứa PHẦN 2 bằng CHƯƠNG 7 + PHẦN 2
  content = content.replace(/#?\s*PHẦN 2: GỐC RỄ TÂM TRÍ[^\r\n]*/g, (match) => {
    return `CHƯƠNG 7\r\n${match.replace('#', '').trim()}`;
  });
  modified = true;
  console.log('✅ Đã định dạng tiêu đề Phần 2 thành CHƯƠNG 7');
}

// 2. Phần 3
if (content.includes('PHẦN 3: LÁ CHẮN TẾ BÀO') && !content.includes('CHƯƠNG 8\r\nPHẦN 3: LÁ CHẮN TẾ BÀO') && !content.includes('CHƯƠNG 8\nPHẦN 3: LÁ CHẮN TẾ BÀO')) {
  content = content.replace(/#?\s*PHẦN 3: LÁ CHẮN TẾ BÀO[^\r\n]*/g, (match) => {
    return `CHƯƠNG 8\r\n${match.replace('#', '').trim()}`;
  });
  modified = true;
  console.log('✅ Đã định dạng tiêu đề Phần 3 thành CHƯƠNG 8');
}

// 3. Phần 4
if (content.includes('PHẦN 4') && !content.includes('CHƯƠNG 9\r\nPHẦN 4') && !content.includes('CHƯƠNG 9\nPHẦN 4')) {
  content = content.replace(/#?\s*PHẦN 4\s*[-–—][^\r\n]*/g, (match) => {
    return `CHƯƠNG 9\r\n${match.replace('#', '').trim()}`;
  });
  modified = true;
  console.log('✅ Đã định dạng tiêu đề Phần 4 thành CHƯƠNG 9');
}

if (modified) {
  fs.writeFileSync(contentPath, content, 'utf8');
  console.log('💾 Đã lưu file content.md mới!');
  
  // Chạy generate-ebook.js để cập nhật Ebook HTML
  console.log('🔄 Đang chạy script sinh Ebook HTML...');
  try {
    execSync('node src/generate-ebook.js', { stdio: 'inherit' });
    console.log('🎉 Đã cập nhật thành công file Ebook HTML với Mục Lục đầy đủ 9 Chương!');
  } catch (error) {
    console.error('❌ Lỗi chạy script sinh Ebook:', error.message);
  }
} else {
  console.log('⚠️ Không có thay đổi nào cần thực hiện. Các tiêu đề đã được định dạng chuẩn.');
}
