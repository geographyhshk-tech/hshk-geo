# 🗺️ GEOGRAPHY EDU - TỔNG QUAN CẤU TRÚC DỰ ÁN (PROJECT STRUCTURE)

> **Dự án:** Nền tảng Lưu trữ & Học tập Địa lí Toàn diện 4.0  
> **Đơn vị phát triển:** High School Help Kit (HSHK) & Group Địa Lí  
> **Tác giả:** Trần Huy Vũ  
> **Phiên bản:** 2.0.0

---

## 📂 SƠ ĐỒ CÂY THƯ MỤC (DIRECTORY TREE)

```text
d:\hshk.geo/
├── 📄 index.html                # Giao diện chính (SPA), tích hợp toàn bộ modal, view và Auth Gate
├── 📄 server.js                  # Backend API Gateway (Node.js HTTP Server) tích hợp Gemini AI Proxy & Rate Limiting
├── 📄 server.ps1                 # Backend Server dự phòng chạy bằng PowerShell Native
├── 📄 firestore.rules            # Hệ thống phân quyền & bảo mật cơ sở dữ liệu Cloud Firestore
├── 📄 sw.js                      # Service Worker xử lý bộ nhớ đệm (Cache) & hỗ trợ Offline PWA
├── 📄 manifest.json              # Cấu hình Progressive Web App (PWA) cài đặt ứng dụng trên di động/PC
├── 📄 package.json               # Khai báo cấu hình Node.js, dependencies và scripts thực thi
├── 📄 .env.example               # Mẫu biến môi trường (PORT, GEMINI_API_KEY, NODE_ENV)
├── 📄 .gitignore                 # Cấu hình bỏ qua các file nhạy cảm khi đẩy lên Git
│
├── 📁 assets/                    # Tài nguyên hình ảnh, biểu trưng dự án
│   ├── 📄 logo.png               # Logo chính thức của High School Help Kit & Geography Edu
│   └── 📄 bg.png                 # Hình nền không gian học tập Địa lí
│
├── 📁 css/                       # Hệ thống định dạng & giao diện
│   └── 📄 style.css              # Toàn bộ CSS (Responsive, Dark Mode, Glassmorphism, Animation)
│
├── 📁 js/                        # Mã nguồn logic JavaScript Frontend (Vanilla JS)
│   ├── 📄 firebase-config.js     # Khởi tạo kết nối Firebase SDK (Auth, Firestore, App Check)
│   ├── 📄 auth.js                # Quản lý xác thực, phân quyền (RBAC), bảo vệ phiên, chống Brute-force
│   ├── 📄 data.js                # Cơ sở dữ liệu mẫu, danh mục Địa lí, bài viết khởi tạo ban đầu
│   ├── 📄 i18n.js                # Bộ từ điển đa ngôn ngữ (Tiếng Việt, Tiếng Anh) & engine dịch thuật
│   ├── 📄 ai-chat.js             # Logic Trợ lý AI Địa lí (Gemini 1.5 Flash), hỏi đáp & tra cứu tài liệu
│   └── 📄 app.js                 # Điều khiển UI trung tâm, bộ lọc tài liệu, bookmark, confession, Admin panel
│
└── 📁 tests/                     # Bộ kiểm thử tự động (PowerShell & Node.js Test Suite)
    ├── 📄 run_all_tests.ps1      # Script chạy toàn bộ test tự động trên Windows
    ├── 📄 run_node_tests.js      # Script chạy unit test trên môi trường Node.js
    ├── 📄 test_api_gateway.ps1   # Kiểm tra API Gateway, Health Check, Rate Limiter
    ├── 📄 test_auth_security.ps1 # Kiểm tra luồng xác thực & bảo mật tài khoản
    ├── 📄 test_blacklist_security.ps1 # Kiểm tra cơ chế chặn email/tài khoản vi phạm
    ├── 📄 test_crypto_vault.ps1  # Kiểm tra mã hóa mật khẩu & an toàn dữ liệu
    ├── 📄 test_i18n.ps1          # Kiểm tra đa ngôn ngữ & chuyển đổi locale
    └── 📄 test_ui_features.ps1   # Kiểm tra tính năng giao diện người dùng
```

---

## 🧩 CHI TIẾT CÁC THÀNH PHẦN CHÍNH (CORE COMPONENTS)

### 1. Frontend & Giao diện người dùng (Client-Side)
* **[index.html](file:///d:/hshk.geo/index.html):** 
  * Cấu trúc Single Page Application (SPA).
  * Chứa cổng bảo vệ quyền truy cập (`Auth Gate`), thanh trạng thái mạng (Online/Offline), hệ thống Navigation, kho tài liệu phân cấp (Lớp 10, 11, 12, Chuyên đề), hòm thư Confession, và bảng điều khiển Quản trị viên (Admin Dashboard).
  * Tích hợp các thẻ bảo mật trình duyệt: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
* **[css/style.css](file:///d:/hshk.geo/css/style.css):**
  * Thiết kế giao diện hiện đại với phong cách Glassmorphism, hỗ trợ Dark Mode tự động/thủ công, hiệu ứng chuyển cảnh mượt mà và tương thích 100% thiết bị di động.
* **[js/app.js](file:///d:/hshk.geo/js/app.js):**
  * Trái tim điều khiển toàn bộ tương tác: Tìm kiếm thông minh theo từ khóa, lọc theo lớp/danh mục/định dạng, quản lý tài liệu yêu thích (`saved_docs`), gửi câu hỏi Confession, chấm điểm đánh giá tài liệu, chế độ bảo trì hệ thống.
* **[js/auth.js](file:///d:/hshk.geo/js/auth.js):**
  * Xử lý đăng ký, đăng nhập, đăng xuất, đổi mật khẩu.
  * Tích hợp cơ chế phát hiện dò mật khẩu (Brute-force protection) và ghi nhận cảnh báo vào `security_incidents`.
* **[js/ai-chat.js](file:///d:/hshk.geo/js/ai-chat.js):**
  * Cung cấp khung chat AI trực tiếp trên web, kết nối qua Backend API Gateway để giải đáp kiến thức Địa lý 24/7.
* **[js/i18n.js](file:///d:/hshk.geo/js/i18n.js):**
  * Hệ thống chuyển ngữ linh hoạt giữa tiếng Việt và tiếng Anh cho toàn bộ giao diện và thông báo.

---

### 2. Backend & API Gateway
* **[server.js](file:///d:/hshk.geo/server.js) (Node.js):**
  * Máy chủ web tĩnh kết hợp API Gateway bảo mật.
  * Đóng vai trò Reverse Proxy an toàn cho Google Gemini AI (`/api/ai/chat`, `/api/ai/translate`), giúp ẩn hoàn toàn `GEMINI_API_KEY` khỏi mã nguồn phía client.
  * Tích hợp **In-memory Rate Limiter** chống spam request (tối đa 30 requests/phút/IP).
  * Tự động gắn các Header bảo mật HTTP (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`).
* **[server.ps1](file:///d:/hshk.geo/server.ps1) (PowerShell):**
  * Máy chủ web dự phòng nhẹ trên môi trường Windows mà không cần cài đặt thêm runtime bên ngoài.

---

### 3. Cơ sở dữ liệu & Phân quyền ([firestore.rules](file:///d:/hshk.geo/firestore.rules))
Hệ thống Cloud Firestore được tổ chức thành 10 Collections chuyên biệt, bảo vệ bằng Security Rules **tối ưu 0-Read cost**:

| STT | Collection | Mục đích sử dụng | Quyền truy cập |
|---|---|---|---|
| 1 | `users` | Thông tin người dùng & phân quyền | Chủ tài khoản đọc/sửa, Admin quản lý |
| 2 | `documents` | Kho tài liệu Địa lý (PDF, Docx, Đề thi) | Công khai đọc, Admin thêm/sửa/xóa |
| 3 | `saved_docs` | Danh sách tài liệu đã đánh dấu/lưu cá nhân | Chỉ chủ sở hữu email xem và cập nhật |
| 4 | `hshk_posts` | Bài viết giới thiệu dự án High School Help Kit | Công khai đọc, Admin đăng/sửa |
| 5 | `group_posts` | Bài viết chuyên môn từ Group Địa Lí | Công khai đọc, Admin đăng/sửa |
| 6 | `confessions` | Hòm thư ẩn danh & hỏi đáp học sinh | Học sinh gửi, Admin trả lời |
| 7 | `contact_info` | Thông tin liên hệ, hotline, fanpage dự án | Công khai đọc, Admin cập nhật |
| 8 | `system_settings` | Trạng thái bảo trì & cấu hình hệ thống | Công khai đọc, Super Admin cấu hình |
| 9 | `security_incidents` | Nhật ký ghi nhận sự cố bảo mật / Brute-force | Hệ thống ghi nhận, Admin theo dõi |
| 10 | `blocked_emails` | Danh sách email bị khóa vi phạm tiêu chuẩn | Công khai kiểm tra, Admin quản lý |
| 11 | `user_telemetry` | Phân tích môi trường thiết bị & trình duyệt để tối ưu UI | Thu thập khi bật, Super Admin xem & bật/tắt |

---

### 4. Kiểm thử tự động ([tests/](file:///d:/hshk.geo/tests))
Dự án được trang bị bộ kịch bản kiểm thử toàn diện:
* Chạy toàn bộ kiểm thử: `npm test` hoặc thực thi `./tests/run_all_tests.ps1`.
* Đảm bảo tính toàn vẹn của luồng Auth, cơ chế mã hóa mật khẩu, khả năng chặn IP spam, bộ từ điển đa ngôn ngữ và giao diện.

---

## 🚀 HƯỚNG DẪN KHỞI CHẠY (QUICK START)

1. **Cài đặt thư viện:**
   ```bash
   npm install
   ```
2. **Cấu hình môi trường:**
   * Tạo file `.env` từ `.env.example` và điền `GEMINI_API_KEY`.
3. **Khởi chạy máy chủ phát triển:**
   ```bash
   npm run dev
   # Truy cập website tại: http://localhost:3000
   ```
4. **Chạy kiểm thử:**
   ```bash
   npm test
   ```
