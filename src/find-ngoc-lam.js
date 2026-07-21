import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const lines = html.split(/\r?\n/);

console.log('🔍 Bắt đầu tìm kiếm từ khóa Ngọc Lâm/chú Lâm trong file HTML...');

let occurrences = 0;
lines.forEach((line, idx) => {
  if (line.includes('Ngọc Lâm') || line.includes('chú Lâm') || line.includes('Chú Lâm')) {
    occurrences++;
    console.log(`\n--- PHÁT HIỆN #${occurrences} tại Dòng ${idx + 1} ---`);
    const start = Math.max(0, idx - 3);
    const end = Math.min(lines.length - 1, idx + 3);
    for (let i = start; i <= end; i++) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
});

console.log(`\n🎉 Tổng số lần phát hiện: ${occurrences}`);
