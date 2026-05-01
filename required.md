# PROJECT MASTER CONTEXT: SHADOWING EDTECH PLATFORM

## 1. Project Overview & Objective
Dự án là một ứng dụng web (tên gốc: `shadowing-backend`) hỗ trợ người dùng luyện nghe tiếng Anh bằng phương pháp Shadowing thông qua video YouTube. 

**Mục tiêu hiện tại (Phase 2):** Nâng cấp hệ thống từ một công cụ xử lý đơn lẻ thành một nền tảng EdTech SaaS toàn diện. Hệ thống cần tích hợp xác thực người dùng, lưu trữ lịch sử học tập (log/transcript) và áp dụng AI (LLM) để tự động sinh bài tập đọc hiểu dựa trên dữ liệu cá nhân hóa của từng học viên.

---

## 2. Current Architecture & Tech Stack (Phase 1)
Hệ thống đang hoạt động ổn định với kiến trúc 3-tier (Presentation, Business, Data Access) không phụ thuộc vào framework UI lớn:

* **Backend (Python/FastAPI):**
    * **Core Role:** Đóng vai trò Proxy server để cào phụ đề YouTube qua `youtube-transcript-api`, giúp Frontend vượt qua chính sách bảo mật CORS của trình duyệt.
    * **Business Logic:** Xử lý thuật toán ẩn từ (đục lỗ) bằng Regex (`\b[A-Za-z][A-Za-z']*\b`) dựa trên mức độ khó (15% - 55%). Đảm nhiệm việc chuẩn hóa chuỗi và tính toán điểm số (Accuracy Score) để bảo mật đáp án khỏi phía Client.
    * **Server:** Uvicorn (`uvicorn[standard]`) xử lý ASGI, đồng thời phục vụ các file HTML/CSS/JS thông qua module `StaticFiles`.
* **Frontend (Vanilla JS / HTML5 / CSS3):**
    * **DOM Manipulation:** Sử dụng ES6 Modules và thao tác trực tiếp DOM, không dùng Virtual DOM (như React/Vue) để giảm thiểu độ trễ.
    * **Video Synchronization:** Kết hợp `YouTube IFrame API` và vòng lặp `requestAnimationFrame` để theo dõi chính xác `currentTime` của video, tự động pause/play khớp với từng block phụ đề.

---

## 3. New Requirements (Phase 2 - Platform Expansion)
Hệ thống cần được mở rộng với các tính năng sau:
1.  **Identity & Access Management (IAM):** Đăng nhập/Đăng ký, quản lý profile cá nhân.
2.  **Tracking & Logging:** Ghi nhận lịch sử làm bài, điểm số, và lưu lại toàn bộ raw transcript mà người dùng đã hoàn thành trong mỗi phiên (session).
3.  **AI Assessment Generation:** Từ lịch sử transcript đã lưu, trích xuất text đưa qua AI để tự động tạo ra các bài test kiểm tra khả năng đọc hiểu (Reading Comprehension) cho chính video đó.

---

## 4. Technical Blueprint cho Phase 2

### A. Database & ORM (PostgreSQL/SQLite)
Triển khai hệ quản trị cơ sở dữ liệu quan hệ, tương tác thông qua **SQLAlchemy**. Cấu trúc schema cơ bản:
* `Users`: Quản lý định danh (`id`, `username`, `password_hash`, `created_at`).
* `Shadowing_Sessions`: Lưu trữ lượt học (`id`, `user_id`, `video_id`, `accuracy_score`, `completed_at`).
* `Transcripts`: Lưu trữ nội dung bài học (`session_id`, `raw_text`).

### B. Security & Authentication
* **Hashing:** Sử dụng `passlib` (với thuật toán bcrypt) để mã hóa mật khẩu.
* **Tokenization:** Cấp phát và xác thực bằng **JWT (JSON Web Tokens)** qua thư viện `python-jose`. Bảo vệ các endpoint API bằng `Depends(get_current_user)` của FastAPI.

### C. AI Pipeline & Integration
* **Engine:** Gọi API của LLM (Gemini hoặc OpenAI).
* **Data Flow:** Lấy `raw_text` từ bảng `Transcripts` của user -> Lắp vào Master Prompt -> Gọi API -> Nhận kết quả.
* **Prompt Engineering:** Master Prompt bắt buộc sử dụng cơ chế ép kiểu đầu ra (Structured Output), chỉ trả về định dạng JSON thuần mảng các object chứa: `question`, `options` (A, B, C, D), `correct_answer`, `explanation`.
* **Validation:** Đưa chuỗi JSON AI trả về qua **Pydantic Model** trên FastAPI để validate cấu trúc trước khi đẩy xuống UI. (Hệ thống có thể mở rộng tích hợp RAG bằng ChromaDB trong tương lai nếu cần truy xuất chéo nhiều video của người dùng).

### D. Deployment Strategy
* Tiếp tục duy trì môi trường container hóa bằng **Docker** và `docker-compose`.
* Tự động hóa luồng CI/CD thông qua **GitHub Actions**.
* Mục tiêu deploy trên Cloud VPS (Azure / Alibaba Cloud), cấu hình Nginx làm Reverse Proxy đứng trước FastAPI.