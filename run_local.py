import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    print(f"=== Đang khởi động máy chủ thử nghiệm local ===")
    print(f"Thư mục gốc: {DIRECTORY}")
    
    # Thay đổi thư mục làm việc để đảm bảo server đọc đúng file
    os.chdir(DIRECTORY)
    
    handler = Handler
    
    # Cho phép tái sử dụng cổng tránh lỗi 'Address already in use'
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            url = f"http://localhost:{PORT}/index.html"
            print(f"\n[OK] Server local đã sẵn sàng tại: {url}")
            print("Đang tự động mở trình duyệt để chạy thử...")
            
            # Mở trình duyệt web
            webbrowser.open(url)
            
            print("\nNhấn Ctrl + C để tắt Server.")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nĐã tắt Server local. Hẹn gặp lại!")
        sys.exit(0)
    except Exception as e:
        print(f"\n[Lỗi] Không thể chạy server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
