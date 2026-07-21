// opp-knowledge.js — Cơ sở dữ liệu tri thức OPP Amway 2026 (Cập nhật chuẩn hóa PQ, FQ, 21%)

export const OPP_KNOWLEDGE_PROMPT = `

## CƠ SỞ TRI THỨC OPP AMWAY 2026 - ĐỊNH NGHĨA NÂNG CAO (PQ, FQ, 21% VÀ HOA HỒNG LÃNH ĐẠO)

1. Định nghĩa chuẩn về PQ và FQ:
- **PQ (Personal Qualified Month / Personal Q)**: Là tháng đạt tiêu chuẩn 21% của bản thân. Tức là tháng mà bạn đạt tiêu chuẩn Silver Producer (SP) trở lên bằng một trong ba cách đạt chuẩn 21%. (Tuyệt đối không nhầm lẫn PQ là điểm cá nhân PPV).
- **FQ (Frontline Qualified Month / Frontline Q)**: Là tháng đạt tiêu chuẩn 21% của nhánh tuyến dưới trực tiếp F1 của bạn. Số lượng FQ là chỉ số quan trọng để xét duyệt các danh hiệu lãnh đạo cao cấp (như Emerald cần 3 nhánh đạt Q trong 6 tháng, Diamond cần 6 nhánh đạt Q trong 6 tháng) và là căn cứ tính hoa hồng phát triển hệ thống. (Tuyệt đối không nhầm lẫn FQ là điểm nhóm GPV).

2. Ba (3) cách đạt tiêu chuẩn 21% trong tháng (Đạt chuẩn Q):
- **Cách 1**: Doanh số nhóm cá nhân của bạn đạt từ **10.000 PV** trở lên (không có nhánh tuyến dưới nào đạt 21%).
- **Cách 2**: Bạn có **1 nhánh tuyến dưới đạt 21%** (đạt Q) và doanh số nhóm cá nhân của bạn (Personal Group PV - gồm doanh số của bạn và các nhánh còn lại chưa đạt 21%) đạt tối thiểu từ **4.000 PV** trở lên.
- **Cách 3**: Bạn có từ **2 nhánh tuyến dưới trở lên đạt 21%** (đạt Q) độc lập trong tháng. Trường hợp này không yêu cầu doanh số nhóm cá nhân tối thiểu.

3. Hoa hồng Ruby (Thưởng thêm 2%):
- Điều kiện: Doanh số nhóm cá nhân (không tính doanh số của các nhánh 21% đã tách ra và nhánh Platinum bảo trợ quốc tế) đạt từ **20.000 PV** trở lên trong tháng.
- Mức thưởng: Thưởng thêm 2% tính trên toàn bộ doanh số nhóm Ruby đó (ví dụ doanh số Ruby là 686,5 triệu thì tiền thưởng Ruby riêng biệt là 13.730.000 VNĐ).

4. Hoa hồng Lãnh đạo 6% (Leader Commission):
- Điều kiện: Khi bạn có nhánh dưới đạt chuẩn 21% (đạt Q) và nhóm cá nhân của bạn đạt tối thiểu 4.000 PV (hoặc bạn có từ 2 nhánh đạt 21% trở lên).
- Tỷ lệ: Nhận tối đa 6% tính trên doanh số của nhánh đạt 21% tách ra đó.
- Cơ chế bảo trợ: Áp dụng cơ chế bảo trợ tối thiểu (4.000 PV) và bảo trợ tối đa (10.000 PV) để đảm bảo tính công bằng và nỗ lực thực tế của người bảo trợ trực tiếp.
`;

export function getOPPKnowledgePromptSection() {
  return OPP_KNOWLEDGE_PROMPT;
}
