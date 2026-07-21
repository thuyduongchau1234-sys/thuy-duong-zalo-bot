import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const lines = html.split(/\r?\n/);

lines.forEach((line, idx) => {
  if (line.includes('Nguyễn La Thùy Linh') || line.includes('Đoàn Thị Liên')) {
    console.log(`Dòng ${idx + 1}: ${line.trim()}`);
  }
});
