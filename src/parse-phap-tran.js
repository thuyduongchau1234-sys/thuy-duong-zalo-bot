import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const oneDriveDir = "c:\\Users\\ABC\\OneDrive";
const filePath = path.join(oneDriveDir, "文档", "Pháp Trần 2025.docx");
const tempZip = path.join(oneDriveDir, "文档", "PhapTran2025_temp.zip");
const tempDir = path.join(oneDriveDir, "文档", "temp_phap_tran");

console.log("🚀 Bắt đầu parse file Pháp Trần 2025.docx...");

if (!fs.existsSync(filePath)) {
  console.error("❌ Không tìm thấy file Pháp Trần 2025.docx");
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
    const outPath = path.join(oneDriveDir, "文档", "Pháp Trần 2025_clean.txt");
    fs.writeFileSync(outPath, outText, 'utf8');
    console.log(`✅ Đã lưu file text sạch: ${path.basename(outPath)}`);
    
    // In ra 20 dòng đầu
    console.log("\n--- 20 DÒNG ĐẦU CỦA PHÁP TRẦN 2025 ---");
    const lines = outText.split('\n');
    lines.slice(0, 20).forEach(l => console.log(l.trim()));
  } else {
    console.error("❌ Không tìm thấy document.xml");
  }
} catch (err) {
  console.error("❌ Lỗi xử lý:", err.message);
} finally {
  if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
}
