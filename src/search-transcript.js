import fs from 'fs';
import path from 'path';

const transcriptPath = 'c:\\Users\\ABC\\.gemini\\antigravity-ide\\brain\\cf3c0c57-2406-4cbb-8977-d08e7ab0cb1d\\.system_generated\\logs\\transcript.jsonl';
const transcriptFull = 'c:\\Users\\ABC\\.gemini\\antigravity-ide\\brain\\cf3c0c57-2406-4cbb-8977-d08e7ab0cb1d\\.system_generated\\logs\\transcript_full.jsonl';

console.log('🔍 Đang tìm kiếm thông tin về chú Lâm / Ngọc Lâm trong transcript...');

const searchFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Không tìm thấy file transcript: ${filePath}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let matchCount = 0;
  
  lines.forEach((line, idx) => {
    if (line.includes('Lâm') || line.includes('Ngọc Lâm') || line.includes('chú Lâm') || line.includes('Chú Lâm')) {
      matchCount++;
      try {
        const obj = JSON.parse(line);
        console.log(`\nMatch #${matchCount} (Dòng ${idx + 1}):`);
        console.log(`Type: ${obj.type}, Source: ${obj.source}`);
        console.log(`Content (trích đoạn): ${JSON.stringify(obj.content || '').substring(0, 500)}`);
      } catch (e) {
        console.log(`\nMatch #${matchCount} (Dòng ${idx + 1} - Lỗi Parse JSON):`);
        console.log(line.substring(0, 300));
      }
    }
  });
  console.log(`\nFound ${matchCount} matches in ${path.basename(filePath)}`);
};

searchFile(transcriptPath);
