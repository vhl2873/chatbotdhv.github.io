# 🤖 AI Chatbot Đại học Vinh - Frontend

Frontend ứng dụng chatbot với giao diện ChatGPT-style, tích hợp Firebase Authentication và FastAPI backend.

## ✨ Tính năng

- ✅ **Giao diện ChatGPT-style**: Dark theme, hiện đại, chuyên nghiệp
- ✅ **Firebase Authentication**: Đăng ký, đăng nhập với email/password
- ✅ **FastAPI Backend**: Tích hợp với backend FastAPI
- ✅ **Multiple Bot Types**: Simple, Consultant, Educational, Support
- ✅ **RAG Support**: Hỗ trợ Retrieval-Augmented Generation
- ✅ **Modular Architecture**: Code được tổ chức thành modules rõ ràng
- ✅ **Responsive Design**: Tối ưu cho mobile và desktop
- ✅ **Chat History**: Lưu lịch sử chat trong localStorage

## 📁 Cấu trúc (Đã tối ưu)

```
frontend/
├── index.html              # Trang chat chính
├── login.html              # Trang đăng nhập
├── register.html           # Trang đăng ký
├── config.json             # Configuration
│
├── css/
│   ├── variables.css       # CSS Variables (theme)
│   └── chatgpt.css        # Main styles
│
├── js/
│   ├── app.js              # Main entry point
│   ├── constants.js        # Constants
│   │
│   ├── config/             # Configuration modules
│   │   ├── config-loader.js
│   │   └── firebase-config.js
│   │
│   ├── auth/               # Authentication modules
│   │   ├── auth-service.js
│   │   └── auth-controller.js
│   │
│   ├── api/                # API modules
│   │   └── api-client.js
│   │
│   ├── chat/               # Chat modules
│   │   ├── chat-manager.js
│   │   ├── chat-ui.js
│   │   └── chat-controller.js
│   │
│   └── utils/              # Utility modules
│       ├── helpers.js
│       └── storage.js
│
└── docs/
    ├── README.md
    ├── FIREBASE_SETUP.md
    └── STRUCTURE_OPTIMIZED.md
```

## 🚀 Cài đặt

### 1. Cấu hình Firebase

Firebase đã được cấu hình trong `config.json`. Đảm bảo:
- Email/Password authentication đã được enable trong Firebase Console
- Project ID: `chatbotgents`

### 2. Chạy Backend FastAPI

```bash
cd backend_fastapi
uvicorn main:app --reload
```

### 3. Mở Frontend

**Option 1: Local Server (Khuyến nghị)**
```bash
cd frontend
python -m http.server 8001
```

Truy cập: `http://localhost:8001/login.html`

**Option 2: Mở trực tiếp**
- Mở `login.html` trong browser

## 📦 Modules

### Config Module
- Load configuration từ `config.json`
- Initialize Firebase

### Auth Module
- Firebase authentication
- Sign in, sign up, sign out
- Token management

### API Module
- API calls đến FastAPI backend
- Auto-inject Firebase token
- Error handling

### Chat Module
- Chat state management
- UI rendering
- Event handling

### Utils Module
- Helper functions
- LocalStorage wrapper
- Format utilities

## 🎯 Sử dụng

1. **Đăng ký**: Mở `register.html`, tạo tài khoản
2. **Đăng nhập**: Mở `login.html`, đăng nhập
3. **Chat**: Tự động chuyển đến `index.html` sau khi đăng nhập
4. **Chọn Bot Type**: Dropdown trong header
5. **Đăng xuất**: Nút "Đăng xuất" trong sidebar

## ⚙️ Cấu hình

### API URL
Sửa `config.json`:
```json
{
  "api": {
    "host": "http://localhost:8000/chat"
  }
}
```

### Firebase Config
Đã được cấu hình sẵn trong `config.json`

## 🔧 Development

### Thêm module mới

1. Tạo file trong thư mục phù hợp
2. Export qua `window` object
3. Load trong `app.js` nếu cần

### Sửa CSS

- Theme colors: Sửa `css/variables.css`
- Styles: Sửa `css/chatgpt.css`

## 📝 Notes

- Modules được load theo thứ tự dependency
- Tất cả modules expose qua `window` object
- Error handling được tích hợp sẵn
- Code được tối ưu và modular

## 🔗 Links

- **Backend**: http://localhost:8000
- **Swagger**: http://localhost:8000/docs
- **Frontend**: http://localhost:8001/login.html

---

**Version**: 2.0.0 (Optimized)  
**Last Updated**: 2025-12-09
