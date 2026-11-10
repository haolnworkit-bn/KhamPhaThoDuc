# Sprint 04 — Giải mã Thọ Đức

## Thay đổi gameplay

Thay vì chỉ đến marker và đọc thông báo, chương mở đầu cho người chơi tìm hiểu bốn chủ đề:
1. Tên làng Triền được dẫn trong tư liệu của UBND xã Tam Đa — mở sau hội thoại.
2. Dòng sông Như Nguyệt / sông Cầu và bến Can Vang — mở sau khi thăm Đền Can Vang.
3. Ba di tích đình, đền, chùa Thọ Đức — mở sau khi thăm Chùa Tháp Linh.
4. Lễ hội truyền thống tháng Ba âm lịch — mở sau khi thăm Đình Thọ Đức.

Mỗi câu hỏi có ba lựa chọn, không thưởng khi trả lời sai, và chỉ ghi thẻ khi trả lời đúng. Thẻ đã ghi được giữ lại khi tiếp tục trò chơi, xóa khi bắt đầu game mới hoặc reset.

Sổ kiến thức có liên kết nguồn để người chơi tự đối chiếu. **Không đánh đồng tên làng trước đây với việc đã xác định từ nguyên tên Thọ Đức**. Không suy ra địa giới giáp ranh, tuyến sông lịch sử hoặc vị trí trại quân từ bản đồ OSM hiện tại. Các địa giới chưa được xác minh sẽ là nội dung nghiên cứu sau, không trở thành câu đố có đáp án tự chế.

## Nguồn tham khảo

- [UBND xã Tam Đa — Đền Can Vang, dấu ấn lịch sử](https://tamda.bacninh.gov.vn/news/-/details/65655/-en-can-vang-dau-an-lich-su-92692810), đăng 11/02/2026.
- [Cụm di tích đình, đền, chùa Thọ Đức](https://mybacgiang.vn/vi/detailtravelplace/?id=2375), bài giới thiệu dẫn nguồn Ban Quản lý Di tích tỉnh Bắc Ninh.
- [Sở Văn hóa, Thể thao và Du lịch Bắc Ninh — tư liệu hệ thống phòng tuyến sông Như Nguyệt](https://svhttdl.bacninh.gov.vn/documents/188850/43351101/1._Trich_ngang_phong_tuyen_song_Nhu_Nguyet.pdf).

## Phạm vi và hạn chế

- Nội dung có thể thay đổi nếu nguồn chính thức được cập nhật hoặc xuất hiện tư liệu địa phương chất lượng cao hơn.
- Điểm di tích trên bản đồ là tạm xác định, không dùng để dẫn đường ngoài đời.
- Chương này là **vertical slice nội dung**, chưa phải trò chơi khám phá quê hương hoàn chỉnh.
- Không thay cấu trúc lưu game hiện có: thẻ kiến thức lưu trong localStorage khóa riêng `tho-duc-cultural-clues-v1`.

## Kiểm tra

```bash
npm ci
npm run check
npm run test:e2e
npm run dev
```

Trong game: trò chuyện với NPC → mở «Giải mã quê hương» → giải tên làng → đến các di tích → mở thêm các thẻ → kiểm tra reload / reset.
