import fs from 'fs';
import path from 'path';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';

if (!API_KEY) {
  console.error('❌ Không tìm thấy GEMINI_API_KEY trong file .env');
  process.exit(1);
}

// Danh sách 10 Chủ đề lớn và các Chủ đề nhỏ tương ứng
const epicTopics = [
  {
    id: "01",
    category: "TAM_THONG",
    title: "Nguyên Lý Tam Thông",
    micros: [
      { id: "1.1", title: "Khái niệm cốt lõi của Tam Thông Dưỡng Nhan" },
      { id: "1.2", title: "Cơ chế Thông Cơ giải tắc cơ co rút" },
      { id: "1.3", title: "Cơ chế Thông Huyết hồi sinh sắc da hồng hào" },
      { id: "1.4", title: "Cơ chế Thông Kinh Lạc điều hòa tạng phủ" },
      { id: "1.5", title: "Lịch trình sinh học đả thông thải độc mặt" }
    ]
  },
  {
    id: "02",
    category: "GIAC_CO",
    title: "Giải Tắc Cơ Mặt Chuyên Sâu",
    micros: [
      { id: "2.1", title: "Giải tắc cơ trán (Khắc phục nhăn trán)" },
      { id: "2.2", title: "Giải cơ cắn và khớp thái dương hàm (Thon gọn hàm)" },
      { id: "2.3", title: "Giải tắc cơ má nâng cơ chảy xệ (Xóa rãnh cười)" },
      { id: "2.4", title: "Giải tắc cơ quanh mắt (Trị bọng mắt, quầng thâm)" },
      { id: "2.5", title: "Giải cơ hạ góc miệng & cơ cằm (Xóa nếp nhăn miệng)" }
    ]
  },
  {
    id: "03",
    category: "DIEN_CHAN",
    title: "Diện Chẩn Thẩm Mỹ",
    micros: [
      { id: "3.1", title: "Đồ hình phản chiếu Tim và Phổi (Làm sáng da & Hồng da)" },
      { id: "3.2", title: "Đồ hình phản chiếu Gan và Tỳ Vị (Trị mụn, nám)" },
      { id: "3.3", title: "Đồ hình phản chiếu Thận và Nội tiết (Xóa thâm mắt)" },
      { id: "3.4", title: "Bộ huyệt Diện Chẩn nâng cơ trẻ hóa da" },
      { id: "3.5", title: "12 Động tác xoa mặt Diện Chẩn buổi sáng" }
    ]
  },
  {
    id: "04",
    category: "DINH_DUONG",
    title: "Dinh Dưỡng Nutrilite",
    micros: [
      { id: "4.1", title: "Đạm thực vật Protein Nutrilite nâng cấu trúc cơ mặt" },
      { id: "4.2", title: "Vitamin C hữu cơ Bio C Plus kích hoạt Collagen" },
      { id: "4.3", title: "Salmon Omega-3 cấp ẩm da và chống viêm màng tế bào" },
      { id: "4.4", title: "Milk Thistle & Dandelion thải độc gan trị nám từ gốc" },
      { id: "4.5", title: "Double X & CoQ10 chống lão hóa ti thể tế bào da" }
    ]
  },
  {
    id: "05",
    category: "MY_PHAM",
    title: "Mỹ Phẩm Artistry",
    micros: [
      { id: "5.1", title: "Nuôi dưỡng 5 hàng rào sinh học da Artistry" },
      { id: "5.2", title: "Dưỡng ẩm tầng sâu cùng dòng Artistry Hydrating" },
      { id: "5.3", title: "Nâng cơ trẻ hóa da mắt Artistry Renewing" },
      { id: "5.4", title: "Serum đặc trị xóa nhăn sâu và nâng cơ chảy xệ" },
      { id: "5.5", title: "Thải độc phục hồi da tổn thương nhạy cảm" }
    ]
  },
  {
    id: "06",
    category: "VAI_GAY",
    title: "Đả Thông Vai Gáy & Hệ Bạch Huyết",
    micros: [
      { id: "6.1", title: "Tắc nghẽn cơ vai gáy gây sạm nám da mặt" },
      { id: "6.2", title: "Kỹ thuật vuốt hệ bạch huyết thải độc cổ" },
      { id: "6.3", title: "Đả thông kinh Đởm vùng sau gáy giảm nhức đầu" },
      { id: "6.4", title: "Thải độc nọng cằm tạo viền hàm V-line tự nhiên" },
      { id: "6.5", title: "Dinh dưỡng sụn khớp cổ vai gáy khỏe mạnh" }
    ]
  },
  {
    id: "07",
    category: "DO_TUOI",
    title: "Chăm Sóc Theo Độ Tuổi",
    micros: [
      { id: "7.1", title: "Ngăn ngừa lão hóa sớm cho phụ nữ tuổi 25+" },
      { id: "7.2", title: "Khắc phục sụt lún cơ má rãnh cười cho phụ nữ tuổi 35+" },
      { id: "7.3", title: "Nâng cơ trẻ hóa toàn diện cho phụ nữ tuổi 45+" },
      { id: "7.4", title: "Chăm sóc da ổn định trong chu kỳ kinh nguyệt" },
      { id: "7.5", title: "Trẻ hóa nội tiết tố tiền mãn kinh tự nhiên" }
    ]
  },
  {
    id: "08",
    category: "SAI_LAM",
    title: "Sai Lầm Dưỡng Da",
    micros: [
      { id: "8.1", title: "Hậu quả đơ cứng cơ do tiêm chất làm đầy Botox/Filler" },
      { id: "8.2", title: "Rửa mặt và chà xát sai cách gây xệ cơ mặt" },
      { id: "8.3", title: "Tư thế nằm ngủ nghiêng gây lệch gò má và sâu rãnh cười" },
      { id: "8.4", title: "Hiện tượng Glycation đứt gãy Collagen do ăn nhiều đường" },
      { id: "8.5", title: "Thói quen siết nghiến răng khi stress gây phì đại cơ hàm" }
    ]
  },
  {
    id: "09",
    category: "NOI_TAM",
    title: "Nội Tâm An Vui (WIT)",
    micros: [
      { id: "9.1", title: "Trạng thái nội tâm an vui phản chiếu lên cơ mặt" },
      { id: "9.2", title: "Sự thả lỏng khớp cắn cơ nhai đón nhận khí lành" },
      { id: "9.3", title: "Lòng biết ơn cơ thể nuôi dưỡng sự trẻ hóa tế bào" },
      { id: "9.4", title: "Quảng bá WIT gieo nhân tốt lành cho nhan sắc" },
      { id: "9.5", title: "Tư duy làm chủ 4 khía cạnh cuộc đời khỏe đẹp" }
    ]
  },
  {
    id: "10",
    category: "SPA_WELLNESS",
    title: "Đào Tạo Spa Dưỡng Sinh",
    micros: [
      { id: "10.1", title: "Tiêu chuẩn setup không gian Spa Wellness trị liệu" },
      { id: "10.2", title: "Quy trình đả thông đón tiếp và chăm sóc khách hàng" },
      { id: "10.3", title: "Giáo trình đào tạo kỹ thuật viên Tam Thông Dưỡng Nhan" },
      { id: "10.4", title: "Định hướng nghề nghiệp ngành Sức khỏe và Làm đẹp" },
      { id: "10.5", title: "Ứng dụng công nghệ tối ưu hóa vận hành Spa" }
    ]
  }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateBatch(category, subject, microId, microTitle, startIdx, count) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  
  const systemPrompt = `Bạn là Giám đốc Nội dung và Chuyên gia Pinterest SEO cho thương hiệu Tam Thông Dưỡng Nhan của Thùy Dương Spa.
Nhiệm vụ của bạn là sinh ra danh sách gồm đúng ${count} Pinterest Pin chất lượng cao, độc bản cho chủ đề nhỏ sau đây:
Danh mục: ${category}
Chủ đề: ${microTitle}
Mã bắt đầu từ ID: PIN_${microId}.${String(startIdx).padStart(2, '0')} đến PIN_${microId}.${String(startIdx + count - 1).padStart(2, '0')}

BẮT BUỘC trả về dữ liệu thuần định dạng JSON Array chứa các Object. Không bọc trong thẻ markdown \`\`\`json.
Cấu trúc mỗi Object phải gồm đúng các trường sau:
{
  "id": "Mã Pin dạng PIN_X.Y.ZZ",
  "category": "Mã danh mục '${category}'",
  "subject": "Tên chủ đề nhỏ '${microTitle}'",
  "title": "Tiêu đề chuẩn SEO Pinterest (chứa từ khóa chính)",
  "imageText": "Câu chữ ngắn gọn nổi bật hiển thị trên ảnh Quote (dưới 10 từ)",
  "description": "Mô tả Pinterest (dưới 500 ký tự, tự nhiên, chứa từ khóa chính)",
  "keywords": "10 từ khóa SEO ngăn cách bằng dấu phẩy",
  "hashtags": "10 hashtags ngăn cách bằng dấu phẩy",
  "altText": "Alt text mô tả ảnh hỗ trợ SEO",
  "cta": "Lời kêu gọi hành động (CTA) thu hút",
  "promptImg": "Prompt tạo ảnh chi tiết bằng tiếng Anh cho Midjourney",
  "promptVideo": "Prompt tạo video ngắn bằng tiếng Anh cho Runway/Sora",
  "facebook": "Ý tưởng bài viết Facebook chi tiết",
  "tiktok": "Ý tưởng kịch bản video TikTok 30 giây",
  "website": "Ý tưởng tiêu đề và cấu trúc bài blog SEO Website"
}`;

  const prompt = `Hãy sinh đúng ${count} Pinterest Pin cho chủ đề nhỏ "${microTitle}" (Mã: ${microId}). Đảm bảo không trùng lặp ý, nội dung cực kỳ thiết thực, sâu sắc, đúng định vị spa cao cấp Tam Thông Dưỡng Nhan, kết hợp Diện Chẩn, dinh dưỡng hữu cơ Nutrilite, mỹ phẩm thuần chay Artistry và nội tâm an vui WIT.`;

  try {
    const response = await axios.post(url, {
      contents: [{
        parts: [{ text: prompt }]
      }],
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return [];
    
    return JSON.parse(text);
  } catch (error) {
    console.error(`⚠️ Lỗi khi sinh dữ liệu cho ${microId} (đợt bắt đầu từ ${startIdx}):`, error.message);
    return [];
  }
}

async function run() {
  console.log('🏁 Khởi động Tiến Trình Tự Động Sản Xuất 5.000 Pinterest Pin...');
  
  const allPins = [];
  const outputFile = path.join(process.cwd(), 'Thuvien_5000_Pinterest_Pins.json');
  const csvFile = path.join(process.cwd(), 'Thuvien_5000_Pinterest_Pins.csv');
  const htmlFile = path.join(process.cwd(), 'Tam_Thong_Pinterest_Gallery.html');

  // Đọc dữ liệu cũ nếu đã tồn tại để tiếp tục sinh (tránh mất mát khi lỗi)
  if (fs.existsSync(outputFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      allPins.push(...data);
      console.log(`📋 Đã tải ${allPins.length} Pins hiện có từ file lưu trữ.`);
    } catch (e) {
      console.log('⚠️ Tệp lưu trữ cũ bị lỗi, bắt đầu sinh mới.');
    }
  }

  // Để sinh thử nghiệm nhanh hơn và tránh rate limit cực hạn của gói free, 
  // mỗi chủ đề nhỏ ta sẽ sinh 2 Pins mẫu chất lượng cao làm nền móng (Tổng 100 Pins hoàn chỉnh phủ đều 50 chủ đề).
  // Chị Dương có thể nâng số lượng này lên 100 Pins mỗi chủ đề bất cứ lúc nào trong code này.
  const pinsPerTopic = 2; 

  let countGenerated = 0;
  for (const epic of epicTopics) {
    console.log(`\n📂 [CHỦ ĐỀ LỚN ${epic.id}]: ${epic.title}`);
    for (const micro of epic.micros) {
      // Kiểm tra xem chủ đề này đã sinh đủ số lượng Pin chưa
      const existingCount = allPins.filter(p => p.id.startsWith(`PIN_${micro.id}`)).length;
      if (existingCount >= pinsPerTopic) {
        console.log(`   ✅ Chủ đề ${micro.id} đã có đủ ${existingCount} Pins. Bỏ qua.`);
        continue;
      }

      console.log(`   ⏳ Đang sinh ${pinsPerTopic - existingCount} Pins cho [${micro.id}]: ${micro.title}...`);
      const newPins = await generateBatch(epic.category, epic.title, micro.id, micro.title, existingCount + 1, pinsPerTopic - existingCount);
      
      if (newPins && newPins.length > 0) {
        allPins.push(...newPins);
        countGenerated += newPins.length;
        
        // Lưu tạm thời ngay lập tức để tránh mất dữ liệu
        fs.writeFileSync(outputFile, JSON.stringify(allPins, null, 2), 'utf8');
        console.log(`   ✨ Đã lưu thành công ${newPins.length} Pins mới. Tổng cộng hiện tại: ${allPins.length} Pins.`);
      }
      
      // Nghỉ 4 giây tránh rate limit API
      await sleep(4000);
    }
  }

  console.log(`\n🎉 ĐÃ HOÀN THÀNH TIẾN TRÌNH SINH TỰ ĐỘNG!`);
  console.log(`📊 Tổng số Pins hiện có trong thư viện: ${allPins.length}`);

  // 1. Xuất file CSV chất lượng cao
  let csvContent = "\ufeffID,Danh muc,Chu de,Tieu de SEO,Chu tren anh,Mo ta,Tu khoa,Hashtag,Alt Text,CTA,Prompt Anh,Prompt Video,Facebook,TikTok,Website,Trang thai\n";
  allPins.forEach(pin => {
    const row = [
      pin.id,
      pin.category,
      pin.subject || '',
      `"${(pin.title || '').replace(/"/g, '""')}"`,
      `"${(pin.imageText || '').replace(/"/g, '""')}"`,
      `"${(pin.description || '').replace(/"/g, '""')}"`,
      `"${(pin.keywords || '').replace(/"/g, '""')}"`,
      `"${(pin.hashtags || '').replace(/"/g, '""')}"`,
      `"${(pin.altText || '').replace(/"/g, '""')}"`,
      `"${(pin.cta || '').replace(/"/g, '""')}"`,
      `"${(pin.promptImg || '').replace(/"/g, '""')}"`,
      `"${(pin.promptVideo || '').replace(/"/g, '""')}"`,
      `"${(pin.facebook || '').replace(/"/g, '""')}"`,
      `"${(pin.tiktok || '').replace(/"/g, '""')}"`,
      `"${(pin.website || '').replace(/"/g, '""')}"`,
      "Sẵn sàng"
    ].join(",");
    csvContent += row + "\n";
  });
  fs.writeFileSync(csvFile, csvContent, 'utf8');
  console.log(`📂 Đã xuất file CSV chuẩn Google Sheets tại: ${csvFile}`);

  // 2. Tự động đồng bộ hóa nạp toàn bộ Pins vào file HTML Gallery tương tác
  if (fs.existsSync(htmlFile)) {
    let htmlContent = fs.readFileSync(htmlFile, 'utf8');
    
    // Tìm mảng pinsData và thay thế bằng dữ liệu mới nhất
    const startToken = 'const pinsData = [';
    const endToken = '];';
    
    const startIdx = htmlContent.indexOf(startToken);
    const endIdx = htmlContent.indexOf(endToken, startIdx);
    
    if (startIdx !== -1 && endIdx !== -1) {
      const before = htmlContent.substring(0, startIdx + startToken.length);
      const after = htmlContent.substring(endIdx);
      const newArrayStr = '\n' + allPins.map(p => '            ' + JSON.stringify(p)).join(',\n') + '\n        ';
      
      fs.writeFileSync(htmlFile, before + newArrayStr + after, 'utf8');
      console.log(`🎨 Đã đồng bộ thành công ${allPins.length} Pins vào giao diện Gallery tương tác!`);
    }
  }
}

run().catch(console.error);
