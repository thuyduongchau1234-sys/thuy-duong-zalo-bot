import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const lines = html.split(/\r?\n/);

console.log('🔍 Liệt kê tất cả các thẻ h2, h3 ở cuối file HTML...');

lines.forEach((line, idx) => {
  if (idx > 11000) {
    if (line.includes('<h2') || line.includes('<h3') || line.includes('class="part-title"') || line.includes('class="chapter-title"')) {
      console.log(`Dòng ${idx + 1}: ${line.trim()}`);
    }
  }
});
