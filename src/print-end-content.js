import fs from 'fs';

const content = fs.readFileSync('src/content.md', 'utf8');
const lines = content.split(/\r?\n/);
const len = lines.length;
console.log(`Tổng số dòng trong content.md: ${len}`);
console.log("--- 100 DÒNG CUỐI CỦA CONTENT.MD ---");
for (let i = Math.max(0, len - 100); i < len; i++) {
  console.log(`Dòng ${i + 1}: ${lines[i]}`);
}
