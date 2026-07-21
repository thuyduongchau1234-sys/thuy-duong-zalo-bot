import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const downloadsDir = "c:\\Users\\ABC\\Downloads";
const tempDir = "c:\\Users\\ABC\\Downloads\\temp_docx_extracted";

console.log("🚀 Bắt đầu quét và parse tất cả file docx trong Downloads...");

const files = fs.readdirSync(downloadsDir);
const docxFiles = files.filter(f => f.endsWith('.docx'));

console.log(`Tìm thấy ${docxFiles.length} file docx.`);

docxFiles.forEach(file => {
  const filePath = path.join(downloadsDir, file);
  const tempZip = path.join(downloadsDir, file.replace('.docx', '_temp.zip'));
  
  console.log(`\n📄 Đang xử lý: ${file}`);
  
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
      const outPath = path.join(downloadsDir, file.replace('.docx', '_clean.txt'));
      fs.writeFileSync(outPath, outText, 'utf8');
      console.log(`✅ Đã lưu file text sạch: ${path.basename(outPath)}`);
    } else {
      console.error(`❌ Không tìm thấy document.xml cho ${file}`);
    }
  } catch (err) {
    console.error(`❌ Lỗi xử lý ${file}:`, err.message);
  } finally {
    // Clean up
    if (fs.existsSync(tempZip)) fs.unlinkSync(tempZip);
    if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log("\n🎉 Hoàn thành quét tất cả file docx!");
