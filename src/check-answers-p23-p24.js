import fs from 'fs';

const html = fs.readFileSync('Giai_Dap_Khoa_Hoc_Vat_Ly_Thien_Tong_Ebook.html', 'utf8');

// Tìm vị trí Phần 23 và 24
const p23Idx = html.indexOf('id="part-23"');
const p24Idx = html.indexOf('id="part-24"');
const endIdx = html.indexOf('id="tocModal"'); // Hoặc cuối file

const p23Content = html.substring(p23Idx, p24Idx);
const p24Content = html.substring(p24Idx, endIdx);

console.log('--- PHẦN 23 ANSWERERS ---');
const regex = /answer-header">([\s\S]*?)<\/div>/gi;
let match;
const p23Answerers = new Set();
while ((match = regex.exec(p23Content)) !== null) {
  p23Answerers.add(match[1].replace(/<[^>]*>/g, '').trim());
}
console.log(Array.from(p23Answerers));

console.log('\n--- PHẦN 24 ANSWERERS ---');
regex.lastIndex = 0;
const p24Answerers = new Set();
while ((match = regex.exec(p24Content)) !== null) {
  p24Answerers.add(match[1].replace(/<[^>]*>/g, '').trim());
}
console.log(Array.from(p24Answerers));
