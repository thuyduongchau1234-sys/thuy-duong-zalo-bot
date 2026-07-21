import fs from 'fs';

const htmlPath = 'Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html';
console.log('🔄 Đọc và tìm kiếm tiêu đề thô trong file HTML...');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ Không tìm thấy file HTML');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Tìm tất cả các thẻ h1, h2, h3
const h2Regex = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
const h3Regex = /<h3\b[^>]*>([\s\S]*?)<\/h3>/gi;

console.log('--- CÁC THẺ H2 TRONG FILE HTML ---');
let match;
while ((match = h2Regex.exec(html)) !== null) {
  const text = match[1].replace(/<[^>]*>/g, '').trim();
  console.log(`H2: ${text}`);
}

console.log('\n--- CÁC THẺ H3 TRONG FILE HTML (200 thẻ đầu) ---');
let count = 0;
while ((match = h3Regex.exec(html)) !== null && count < 200) {
  const text = match[1].replace(/<[^>]*>/g, '').trim();
  console.log(`H3: ${text}`);
  count++;
}
