#!/bin/bash

# Cấu hình URL Web App của bạn
URL="https://script.google.com/macros/s/AKfycbzDDHbeaQdS5gUNBpxDODe2SUxzw5W9tOkproe9hAQsmshxMCeJMgThMEPD7UgZTnC5Lw/exec"
PROFILE_ID="MC-TEST-$(date +%s)"

echo "=== KHỞI ĐỘNG BẢN CHẠY THỬ NGHIỆM TỰ ĐỘNG ==="
echo "URL Web App: $URL"
echo "Mã hồ sơ chạy thử: $PROFILE_ID"
echo "----------------------------------------"

# Bước 1: Gửi hồ sơ mới
echo "[1/2] Đang gửi một hồ sơ chẩn đoán da mới..."
RESPONSE_1=$(curl -s -L -X POST \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{
    "profileId": "'"$PROFILE_ID"'",
    "customer": {
      "name": "Nguyễn Văn Chạy Thử",
      "email": "test@pharmeshub.vn",
      "phone": "0987654321",
      "birthYear": "1995",
      "job": "Kế toán",
      "city": "Hồ Chí Minh"
    },
    "pigmentation": {
      "duration": "1-3 năm",
      "pattern": "Nám mảng đối xứng",
      "areas": "Hai bên gò má",
      "geneticFactor": "Không rõ",
      "hormoneUsage": "Không sử dụng"
    },
    "history": {
      "treatments": ["Laser trị nám", "Tiêm / Cấy tinh chất"],
      "products": "Serum Vitamin C, Hydroquinone",
      "rapidWhitening": "Không sử dụng"
    },
    "skinBackground": {
      "symptoms": ["khô căng/bong", "mỏng yếu"]
    },
    "personalContext": {
      "factors": ["stress/thiếu ngủ"]
    },
    "images": {
      "front": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      "left": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      "right": "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
    },
    "internalReport": {
      "pigment": "Nám mảng trên nền da mỏng yếu do can thiệp laser",
      "summary": "- **Sắc tố**: Nám mảng đối xứng vùng gò má\n- **Nền da**: Mỏng yếu, khô ráp",
      "next": "- **Hoạt chất khuyên dùng**: Ceramide, HA, B5\n- **Lưu ý**: Chống nắng kỹ"
    }
  }' "$URL")

echo "Phản hồi từ Server:"
echo "$RESPONSE_1"
echo "----------------------------------------"

# Chờ 2 giây
sleep 2

# Bước 2: Gửi yêu cầu tư vấn chuyên sâu
echo "[2/2] Đang gửi yêu cầu tư vấn chuyên sâu cho hồ sơ $PROFILE_ID..."
RESPONSE_2=$(curl -s -L -X POST \
  -H "Content-Type: text/plain;charset=utf-8" \
  -d '{
    "action": "request_consultation",
    "profileId": "'"$PROFILE_ID"'"
  }' "$URL")

echo "Phản hồi từ Server:"
echo "$RESPONSE_2"
echo "----------------------------------------"
echo "=== KẾT THÚC CHẠY THỬ ==="
echo "Kiểm tra Google Sheet để thấy dòng mới và cột Yêu cầu tư vấn (YES) nhé!"
