import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const oneDriveDir = "c:\\Users\\ABC\\OneDrive";
const tempDir = "c:\\Users\\ABC\\OneDrive\\temp_docx_extracted";

const files = [
  'PHẦN 20 GIẢI ĐÁP THIỀN TÔNG ĐẶC BIỆT.docx',
  'trả lời phỏng vấn bmtt.docx',
  '文档\\Pháp Trần 2025.docx'
];

console.log("🚀 Bắt đầu parse file docx từ OneDrive...");

files.forEach(fileRel => {
  const filePath = path.join(oneDriveDir, fileRel);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File không tồn tại: ${filePath}`);
    return;
  }
  
  const baseName = path.basename(fileRel, '.docx');
  const tempZip = path.join(oneDriveDir, `${baseName}_temp.zip`);
  
  console.log(`\n📄 Đang xử lý: ${fileRel}`);
  
  // Copy sang zip
  fs.copyFileSync(filePath, tempZip);
  
  // Giải nén
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${tempDir}' -Force"`);
    
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(xmlPath)) {
      const xmlContent = fs.readFileSync(xmlPath, 'utf8');
      
      const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
      const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g;
      
      let paragraphs = [];
      let match;
      while ((match = pRegex.exec(xmlContent)) !== null) {
        const pContent = match[1];
        let pText = '';
        tRegex.lastIndex = 0;
        let tMatch;
        while ((tMatch = tRegex.exec(pContent)) !== null) {
          pText += tMatch[1];
        }
        paragraphs.push(pText);
      }
      
      const outText = paragraphs.join('\r\n');
      const outPath = path.join(oneDriveDir, `${baseName}_clean.txt`);
      fs.writeFileSync(outPath, outText, 'utf8');
      console.log(`✅ Đã lưu file text sạch: ${path.basename(outPath)}`);
    } else {
      console.error(`❌ Không tìm thấy document.xml cho ${fileRel}`);
    }
  } catch (err) {
    console.error(`❌ Lỗi xử lý ${fileRel}:`, err.message);
  } finally {
    // Clean up
    if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log("\n🎉 Hoàn thành parse file docx từ OneDrive!");
