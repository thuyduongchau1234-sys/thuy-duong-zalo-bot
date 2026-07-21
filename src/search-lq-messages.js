import fs from 'fs';
import path from 'path';

const filesToSearch = [
  'data/messages.json',
  'logs/combined.log',
  'logs/combined1.log'
];

console.log('🔍 Bắt đầu tìm kiếm nội dung Phần 25/26 hoặc chú Lâm trong logs...');

filesToSearch.forEach(file => {
  if (!fs.existsSync(file)) return;
  console.log(`\nSearching file: ${file}`);
  const content = fs.readFileSync(file, 'utf8');
  
  // Tìm các đoạn tin nhắn chứa "chú Lâm", "Ngọc Lâm", "Phần 25", "Phần 26"
  const lines = content.split('\n');
  let matchCount = 0;
  lines.forEach((line, idx) => {
    if (line.includes('chú Lâm') || line.includes('Ngọc Lâm') || line.includes('Phần 25') || line.includes('Phần 26') || line.includes('Phan 25') || line.includes('Phan 26')) {
      matchCount++;
      if (matchCount <= 20) {
        console.log(`Line ${idx + 1}: ${line.substring(0, 300)}`);
      }
    }
  });
  console.log(`Found ${matchCount} matches in ${file}`);
});
