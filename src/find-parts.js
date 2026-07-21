import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf-8');
const regex = /Phần\s+(\d+)/gi;
let match;
const parts = new Set();
while ((match = regex.exec(html)) !== null) {
  parts.add(parseInt(match[1], 10));
}

console.log("Các số Phần tìm thấy trong file HTML:");
console.log(Array.from(parts).sort((a, b) => a - b).join(', '));
