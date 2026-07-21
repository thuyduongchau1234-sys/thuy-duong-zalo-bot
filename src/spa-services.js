// ============================================================
// spa-services.js — Thùy Dương Spa Services & Pricing Knowledge
// ============================================================
// Cung cấp dữ liệu dịch vụ và bảng giá chính xác của Spa Thùy Dương tại Sài Gòn cho AI.
// ============================================================

import fs from 'fs';
import path from 'path';

const SPA_PRICE_FILE = './data/spa_price_list.md';

export const getSpaServicesPromptSection = () => {
  let section = `\n\n## BẢNG GIÁ DỊCH VỤ SPA THÙY DƯƠNG (SÀI GÒN) - BẮT BUỘC TUÂN THỦ BÁM SÁT 100%\n`;
  section += `### NGUYÊN TẮC BÁO GIÁ CỰC KỲ NGHIÊM NGẶT (KHÔNG ĐƯỢC PHÉP VI PHẠM):\n`;
  section += `1. **Báo giá chính xác 100%**: Chỉ báo giá chính xác những dịch vụ và mức giá được ghi rõ bên dưới. Tuyệt đối KHÔNG tự ý suy đoán giá, KHÔNG tự chế ra mức giá mới, KHÔNG tự thêm bớt bất kỳ số tiền nào.\n`;
  section += `2. **Không tự ý thêm bớt dịch vụ**: Chỉ trả lời đúng dịch vụ khách hỏi dựa trên bảng giá. Không tự ý gợi ý thêm các dịch vụ khác nếu khách không yêu cầu hoặc không có trong bảng giá.\n`;
  section += `3. **Khi khách hỏi dịch vụ KHÔNG CÓ trong bảng giá**: Tuyệt đối không tự bịa giá hoặc tự ý báo giá xấp xỉ. Hãy trả lời lịch sự: "Dạ dịch vụ này hiện em chưa cập nhật bảng giá chính xác trên hệ thống. Để em báo lại với chị Thùy Dương kiểm tra và phản hồi trực tiếp cho chị/anh ngay nhé ạ!"\n`;
  section += `4. **Giữ nguyên thông tin mô tả**: Không tự ý tóm tắt làm sai lệch, không phóng đại công dụng hay thay đổi thời gian thực hiện của liệu trình.\n\n`;
  section += `Dưới đây là danh sách dịch vụ và giá chính xác tại spa của chị Thùy Dương ở Sài Gòn:\n\n`;

  try {
    if (fs.existsSync(SPA_PRICE_FILE)) {
      const markdownContent = fs.readFileSync(SPA_PRICE_FILE, 'utf-8');
      // Trích xuất các bảng giá từ file markdown
      section += markdownContent;
    } else {
      // Fallback nếu không đọc được file
      section += `### 1. DỊCH VỤ CHÂN MÀY & MÔI
- Phun mày Ombre tự nhiên: 1.990.000 VNĐ
- Phun mày tán bột Hàn Quốc: 2.390.000 VNĐ
- Phun môi Collagen: 2.190.000 VNĐ
- Phun môi Baby Lips: 2.390.000 VNĐ
- Phun môi Ombre: 2.590.000 VNĐ
- Phun môi Nano: 2.990.000 VNĐ
- Khử thâm môi/Khử đỏ chân mày: 990.000 VNĐ

### 2. GỘI ĐẦU DƯỠNG SINH
- Gói "Gội Sạch" (~30p): 35.000 VNĐ
- Gói "An Yên" (Cơ bản - 45p - Gội thảo dược + Massage đầu, cổ, vai, gáy): 60.000 VNĐ
- Gói "Tỉnh Thức" (Chuyên sâu - 60p - Gội + Đả thông kinh lạc + Day huyệt Diện Chẩn): 150.000 VNĐ
- Gói "Rạng Rỡ" (Dưỡng nhan - 90p - Gội + Gua Sha sừng + Nâng cơ xóa nhăn): 250.000 VNĐ

### 3. TAM THÔNG DƯỠNG NHAN & TRỊ LIỆU MẶT
- Khai thông cơ mặt cơ bản (30 - 45 phút): 299.000 VNĐ
- Tam Thông Dưỡng Nhan cơ bản (60 phút): 399.000 VNĐ
- Tam Thông Dưỡng Nhan chuyên sâu (75 - 90 phút): 599.000 VNĐ
- Tam Thông Dưỡng Nhan VIP (Cổ vai gáy + Nâng cơ, 90 - 120 phút): 799.000 VNĐ
- Điêu khắc khuôn mặt tự nhiên (120 phút): 899.000 VNĐ
- Ưu đãi khách hàng mới trải nghiệm lần đầu: 299.000 VNĐ

### 4. TRIỆT LÔNG VĨNH VIỄN (NÁCH, BIKINI, TOÀN THÂN)
- Mép môi / Cằm (1 lần): 79.000 VNĐ | Gói 10 lần: 632.000 VNĐ
- Nách (1 lần): 159.000 VNĐ | Gói 10 lần: 1.272.000 VNĐ
- Bikini toàn phần (1 lần): 399.000 VNĐ | Gói 10 lần: 3.192.000 VNĐ
- Toàn thân nữ (Gói 10 buổi): 7.992.000 VNĐ`;
    }
  } catch (error) {
    console.error('Lỗi khi đọc file bảng giá spa:', error.message);
  }
  section += `

### 🎁 CHƯƠNG TRÌNH QUÀ TẶNG ĐẶC BIỆT KHI MUA GÓI (ÁP DỤNG ĐỒNG LOẠT):
Khi khách hàng hỏi hoặc có ý định mua gói 5 lần hoặc 10 lần (đặc biệt là dịch vụ triệt lông hoặc chăm sóc da), bạn BẮT BUỘC phải chủ động tư vấn chương trình quà tặng giá trị này để khuyến khích khách mua gói:
- **Mua Gói 5 lần (bất kỳ dịch vụ nào):** Tặng ngay **1 buổi Gội đầu thảo dược "An Yên"** (trị giá 60.000 VNĐ) để thư giãn.
- **Mua Gói 10 lần (bất kỳ dịch vụ nào):** Khách được chọn 1 trong 2 quà tặng cao cấp sau:
  * Tặng **1 buổi Trải nghiệm Tam Thông Dưỡng Nhan cơ bản** (trị giá 299.000 VNĐ - Trẻ hóa, nâng cơ nâng tầm diện mạo).
  * Tặng **1 buổi Gội đầu Dưỡng nhan "Rạng Rỡ"** (trị giá 250.000 VNĐ - 90 phút phục hồi chuyên sâu đắp mặt nạ và massage Gua Sha sừng).`;

  section += `\n\n*(Lưu ý: Mọi thông tin báo giá phải trùng khớp hoàn toàn với bảng dữ liệu trên. Tuyệt đối tuân thủ nguyên tắc không tự ý thêm bớt, không đoán mò).*`;
  return section;
};
