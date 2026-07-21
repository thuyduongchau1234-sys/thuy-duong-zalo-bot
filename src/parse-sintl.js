import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const filePath = "c:\\Users\\ABC\\Documents\\Zalo Received Files\\sintl.docx";
const tempZip = "c:\\Users\\ABC\\Documents\\Zalo Received Files\\sintl_temp.zip";
const tempDir = "c:\\Users\\ABC\\Documents\\Zalo Received Files\\temp_sintl";

console.log("🚀 Bắt đầu parse file sintl.docx...");

if (!fs.existsSync(filePath)) {
  console.error("❌ Không tìm thấy file sintl.docx");
  process.exit(1);
}

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
    console.log(`✅ Parse thành công! Độ dài text: ${outText.length}`);
    
    // In ra 30 dòng đầu
    console.log("\n--- 30 DÒNG ĐẦU CỦA SINTL.DOCX ---");
    const lines = outText.split('\n');
    lines.slice(0, 30).forEach(l => console.log(l.trim()));
  } else {
    console.error("❌ Không tìm thấy document.xml");
  }
} catch (err) {
  console.error("❌ Lỗi xử lý:", err.message);
} finally {
  if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}
