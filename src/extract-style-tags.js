import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');
const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
let match = styleRegex.exec(html);
if (match) {
  console.log("--- STYLE TAG CONTENT (First 1000 chars) ---");
  console.log(match[1].trim().substring(0, 1500));
}
