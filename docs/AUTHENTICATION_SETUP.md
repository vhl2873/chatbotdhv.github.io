# 🔐 Hướng dẫn Setup Authentication & Authorization

## 📋 Tổng quan

Hệ thống sử dụng **Firebase Authentication + Firestore** để:
- ✅ Xác thực người dùng (Firebase Auth)
- ✅ Phân quyền và lưu thông tin sinh viên (Firestore)
- ✅ Bảo vệ Academic Assistant chỉ cho sinh viên Đại học Vinh

---

## 🏗️ Kiến trúc

```
Firebase Authentication
    │
    ├── uid (xác thực)
    │
Firebase Firestore
    ├── users/{uid}          # Role và email
    └── students/{uid}        # Thông tin chi tiết sinh viên
```

---

## 📦 Cài đặt

### 1. Firebase Console Setup

1. Vào [Firebase Console](https://console.firebase.google.com/)
2. Chọn project `chatbotgents`
3. Enable **Authentication** → **Email/Password**
4. Enable **Firestore Database**

### 2. Firestore Collections

Tạo 2 collections:

#### Collection: `users`
```javascript
users/{uid} {
  "role": "student" | "admin",
  "email": "sv@vinhuni.edu.vn",
  "createdAt": Timestamp
}
```

#### Collection: `students`
```javascript
students/{uid} {
  "studentCode": "2112345",
  "fullName": "Nguyễn Văn A",
  "faculty": "CNTT",
  "major": "Kỹ thuật phần mềm",
  "courseYear": 2021,
  "isActive": true,
  "createdAt": Timestamp
}
```

**Lưu ý:** `uid` = Firebase Auth UID

### 3. Firestore Security Rules

Deploy file `frontend/firestore.rules` lên Firebase Console:

1. Vào **Firestore Database** → **Rules**
2. Copy nội dung từ `frontend/firestore.rules`
3. Click **Publish**

Rules này đảm bảo:
- ✅ Sinh viên chỉ đọc được dữ liệu của chính mình
- ✅ Không ai được write trực tiếp (chỉ admin qua backend)

---

## 👨‍💼 Import Sinh viên (Admin)

### Cách 1: Import từ JSON

Tạo file `students.json`:

```json
[
  {
    "studentCode": "2112345",
    "fullName": "Nguyễn Văn A",
    "email": "2112345@vinhuni.edu.vn",
    "faculty": "CNTT",
    "major": "Kỹ thuật phần mềm",
    "courseYear": 2021,
    "isActive": true
  },
  {
    "studentCode": "2112346",
    "fullName": "Trần Thị B",
    "email": "2112346@vinhuni.edu.vn",
    "faculty": "CNTT",
    "major": "Kỹ thuật phần mềm",
    "courseYear": 2021,
    "isActive": true
  }
]
```

Chạy script:

```bash
cd backend-day6
python admin_import_students.py students.json
```

### Cách 2: Import từ CSV

Tạo file `students.csv`:

```csv
studentCode,fullName,email,faculty,major,courseYear,isActive
2112345,Nguyễn Văn A,2112345@vinhuni.edu.vn,CNTT,Kỹ thuật phần mềm,2021,true
2112346,Trần Thị B,2112346@vinhuni.edu.vn,CNTT,Kỹ thuật phần mềm,2021,true
```

Chạy script:

```bash
cd backend-day6
python admin_import_students.py students.csv VinhUni@2025
```

**Lưu ý:**
- Mật khẩu mặc định: `VinhUni@2025`
- Sinh viên nên đổi mật khẩu sau lần đăng nhập đầu tiên

---

## 🔒 Frontend Guard

### Academic Assistant Protection

File `frontend/js/guards/academic-auth-guard.js` tự động:
1. ✅ Kiểm tra user đã đăng nhập chưa
2. ✅ Kiểm tra có record trong `students` collection không
3. ✅ Kiểm tra `isActive = true`
4. ✅ Redirect nếu không hợp lệ

**Đã được tích hợp vào `academic-assistant.html`**

---

## 🔐 Backend Verification

### Endpoints được bảo vệ:

1. **POST /academic-chat**
   - Yêu cầu: `Authorization: Bearer <firebase_token>`
   - Verify: `verify_student()`

2. **POST /academic-image-search**
   - Yêu cầu: `Authorization: Bearer <firebase_token>`
   - Verify: `verify_student()`

### Sử dụng trong code:

```python
from auth_service import verify_student

@app.post("/academic-chat")
async def academic_chat(
    request: AcademicChatRequest,
    authorization: Optional[str] = Header(None)
):
    # Verify student
    student = verify_student(authorization)
    
    # student dict chứa:
    # {
    #   'id': uid,
    #   'studentCode': '2112345',
    #   'fullName': 'Nguyễn Văn A',
    #   'faculty': 'CNTT',
    #   ...
    # }
    
    # Tiếp tục xử lý...
```

---

## 🧪 Testing

### 1. Test Frontend Guard

1. Đăng nhập với tài khoản **không phải sinh viên**
2. Truy cập `academic-assistant.html`
3. ✅ Phải bị redirect về `index.html` với thông báo

### 2. Test Backend Verification

```bash
# Lấy Firebase token từ browser console:
# firebase.auth().currentUser.getIdToken()

curl -X POST http://localhost:8000/academic-chat \
  -H "Authorization: Bearer <firebase_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Lộ trình học tập ngành CNTT",
    "model": "gpt-4o-mini"
  }'
```

**Expected:**
- ✅ 200 OK nếu là sinh viên
- ✅ 403 Forbidden nếu không phải sinh viên
- ✅ 401 Unauthorized nếu token không hợp lệ

---

## 📝 Flow hoàn chỉnh

```
1. Admin import sinh viên
   ↓
2. Sinh viên đăng nhập (Firebase Auth)
   ↓
3. Frontend guard kiểm tra Firestore
   ↓
4. Cho phép truy cập Academic Assistant
   ↓
5. Frontend gọi API với Firebase token
   ↓
6. Backend verify token + Firestore
   ↓
7. Trả về dữ liệu học vụ
```

---

## ⚠️ Lưu ý quan trọng

### ❌ KHÔNG NÊN:

1. ❌ Lưu role trong localStorage
2. ❌ Chỉ check email domain
3. ❌ Không verify ở backend
4. ❌ Cho user thường truy cập academic API

### ✅ NÊN:

1. ✅ Luôn verify ở cả frontend và backend
2. ✅ Sử dụng Firestore để lưu thông tin sinh viên
3. ✅ Kiểm tra `isActive` status
4. ✅ Sử dụng Firebase token cho API calls

---

## 🔧 Troubleshooting

### Lỗi: "Access denied: Only students..."

**Nguyên nhân:**
- User chưa có record trong `students` collection
- `isActive = false`

**Giải pháp:**
- Import sinh viên vào Firestore
- Kiểm tra `isActive` status

### Lỗi: "Invalid or expired token"

**Nguyên nhân:**
- Token đã hết hạn
- Token không hợp lệ

**Giải pháp:**
- Đăng nhập lại để lấy token mới
- Kiểm tra Firebase config

### Lỗi: Firestore rules denied

**Nguyên nhân:**
- Rules chưa được deploy
- Rules không đúng

**Giải pháp:**
- Deploy lại `firestore.rules`
- Kiểm tra rules trong Firebase Console

---

## 📚 Tài liệu tham khảo

- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX

