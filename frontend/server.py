# frontend/server.py
import http.server
import socketserver
import os

# Use PORT environment variable for production, default to 8080 for local
PORT = int(os.environ.get('PORT', 8080))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(__file__), **kwargs)
    
    def log_message(self, format, *args):
        # Custom log format to see requests
        print(f"Frontend Server - {self.address_string()} - {format % args}")

print(f"Starting frontend server...")
print(f"Serving frontend at port {PORT}")
print("Press Ctrl+C to stop the server")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")