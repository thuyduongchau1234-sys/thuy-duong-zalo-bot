import fs from 'fs';

const content = fs.readFileSync('src/content.md', 'utf8');
const searchStr = 'da nhạy cảm đôi khi';
const searchStr2 = 'cảm xúc bị dồn nén';

console.log('Trùng 1:', content.toLowerCase().includes(searchStr.toLowerCase()));
console.log('Trùng 2:', content.toLowerCase().includes(searchStr2.toLowerCase()));
