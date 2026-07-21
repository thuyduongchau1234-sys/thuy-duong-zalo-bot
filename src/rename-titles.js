import fs from 'fs';

console.log('🔄 Đổi tiêu đề Phần 25 + Phần 26 thành tên gốc...');

let html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

const old25 = 'Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới (01/2026)';
const new25 = 'Giải Đáp Đặc Biệt Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới (01/2026)';

const old25short = 'Phần 25: Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)';
const new25short = 'Giải Đáp Đặc Biệt Về Lễ Tiễn TTS Ngọc Lâm Về Phật Giới (01/2026)';

const old26 = 'Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới – Phần 4 (26/02/2026)';
const new26 = 'Giải Đáp 56 Câu Hỏi Về Lễ Tiễn Thiền Tông Sư Ngọc Lâm Về Phật Giới – Phần 4 (26/02/2026)';

const old26short = 'Phần 26: Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)';
const new26short = 'Giải Đáp 56 Câu Hỏi Về Lễ Tiễn TTS Ngọc Lâm – Phần 4 (26/02/2026)';

// Replace all occurrences
const replacements = [
  [old25, new25],
  [old25short, new25short],
  [old26, new26],
  [old26short, new26short],
];

let count = 0;
for (const [oldStr, newStr] of replacements) {
  while (html.includes(oldStr)) {
    html = html.replace(oldStr, newStr);
    count++;
  }
}

console.log(`✅ Đã thay đổi ${count} chỗ`);

fs.writeFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', html, 'utf8');
console.log('✅ Hoàn thành!');
