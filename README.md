# Launcher IOS

Webclip mở nhanh ứng dụng trên iPhone. Gắn lên màn hình chính, chọn app, bấm là mở — không cần lục thư viện.

Trang: [Launcher-IOS](https://dammeiosvn.github.io/Launcher-IOS/)

## Cài cấu hình

Bấm trên iPhone, Safari sẽ hỏi cài hồ sơ.

**[Tải LauncherIOS](https://dammeiosvn.github.io/Launcher-IOS/LauncherIOS.mobileconfig)**

Nếu liên kết trên không mở trình cài, dùng bản raw:

**[Tải từ GitHub](https://github.com/dammeiosvn/Launcher-IOS/raw/main/LauncherIOS.mobileconfig)**

Sau khi tải:

1. Cho phép Safari tải hồ sơ.
2. Vào **Cài đặt → Đã tải về hồ sơ** (hoặc **Cài đặt → Cài đặt chung → VPN & Quản lý thiết bị**).
3. Chọn **Launcher IOS** rồi bấm **Cài đặt**.
4. Mở trang, bấm **Chia sẻ → Thêm vào Màn hình chính**.

Hồ sơ chỉ giúp cài webclip và icon. Không xin quyền ngoài việc mở trang.

## Cần có

Shortcut tên đúng **Quick Launcher**. App trên dock gửi bundle ID sang shortcut này:

`shortcuts://run-shortcut?name=Quick%20Launcher&input=text&text=BUNDLE_ID`

Chưa có shortcut thì app trên dock sẽ không mở.

## Dùng

- **+** thêm app. Tìm trong danh sách hệ thống hoặc App Store. Tối đa 8 app.
- Giữ app để xóa.
- Bánh răng: **Lưới** / **Danh sách**, **Đổi tên**, **Thông tin**.
- Ảnh đầu trang: chạm **Chọn ảnh**, kéo khung, **Xác nhận**.
- Giao diện theo sáng tối của máy.

## Trong repo

| File | Việc |
| --- | --- |
| `index.html` | Trang launcher |
| `icon-home-screen.png` | Icon màn hình chính |
| `LauncherIOS.mobileconfig` | Hồ sơ cài nhanh |
| `System/SystemApp.json` | Tên và bundle ID |
| `systemapp/` | Icon từng app |

## Phiên bản

1.0 — bản dùng được trên iPhone.
