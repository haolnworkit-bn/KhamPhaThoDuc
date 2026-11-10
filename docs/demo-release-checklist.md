# Demo release candidate — Thọ Đức: Dấu Ấn Thời Gian

## Phạm vi bản demo

- Chơi được trên trình duyệt desktop/mobile, bắt đầu hoặc tiếp tục phiên chơi.
- Di chuyển nhân vật bốn hướng; trò chuyện với Người dẫn chuyện, khám phá ba điểm di sản tạm xác định.
- Mở khóa cổng thời gian sau khi hoàn thành mục tiêu.
- Hai thời kỳ **Hiện tại** và **1077 (diễn giải)** với trang phục người chơi/NPC riêng.
- Hiện tại: mạng đường/công trình OSM, cây nhà và đình minh họa hiện đại.
- 1077: **không sử dụng mạng đường và footprint nhà hiện đại**; có nhà dân mộc, lối đất, ruộng lúa, ụ rơm, rặng tre mang tính diễn giải (không khẳng định dữ liệu khảo cổ).
- Lưu tiến trình bằng localStorage; minimap sử dụng địa lý hiện đại làm mốc tham chiếu.
- Các thời kỳ Lê, Nguyễn 1845 và thế kỷ XX **chưa được mở** trong bản demo.

## Nguồn gốc và giới hạn tư liệu

Vị trí di tích chỉ mang tính tạm xác định; không dùng cho dẫn đường thực địa. Đình Thọ Đức, Đền Can Vang và Chùa Tháp Linh chỉ là vị trí tham chiếu. Kiến trúc và phục trang thời 1077 là hình ảnh **ước lệ/diễn giải** dựa trên mục tiêu giáo dục, không phải mô hình lịch sử đã xác minh. Không biểu thị đường đất, nhà hay ô ruộng như dữ liệu lịch sử có tọa độ khảo sát. Không sao chép hình ảnh hoặc mô hình từ trang tham khảo.

## Tiêu chí phát hành (bắt buộc)

1. GitHub Actions trên PR: `npm ci`, `npm run check`, `npx playwright install --with-deps chromium`, `npm run test:e2e` đều thành công.
2. Demo desktop/mobile hoàn thành nhiệm vụ và lưu/tải lại tiến trình bình thường.
3. Đổi Hiện tại ↔ 1077 **12 lần** không làm trùng đối tượng, hỏng render hoặc mất tiến trình. Kiểm tra nhân vật và NPC thực sự đổi trang phục.
4. Thời 1077 xuất hiện nhà, vườn lúa, đường đất minh họa; không còn đường OSM/nhà hiện đại trong scene.
5. Kiểm tra khả năng hiển thị SVG mới và fallback khi tải thất bại.
6. Trên `main`, GitHub Actions hoàn thành cả **Build and verify** lẫn **Publish game**; URL GitHub Pages trả nội dung demo đúng base `/KhamPhaThoDuc/`.
7. Ghi nhận build commit và ngày release; chỉ sau bước 6 mới tạo GitHub Release và công bố URL chính thức.

## Chạy cục bộ

```bash
npm ci
npm run check
npm run test:e2e
npm run preview
```

Vite dev: `npm run dev`. Production preview: `npm run build && npm run preview`.

## Giới hạn phiên bản

Đây là **demo trải nghiệm ngắn**, chưa phải sản phẩm 3D hoặc nền tảng khảo cứu lịch sử hoàn chỉnh. Minh họa không tái dựng chính xác di tích năm 1077; chưa có các thời kỳ mở rộng.
