#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys
from urllib.parse import urlparse

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.join(os.path.dirname(__file__), 'dist'), **kwargs)
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_GET(self):
        # Handle client-side routing - serve index.html for non-file requests
        parsed_path = urlparse(self.path)
        if parsed_path.path.startswith('/api'):
            # For API requests, we'd need a proxy, but for now just return 404
            self.send_error(404, "API requests need backend server")
            return
        
        # If the file doesn't exist and it's not a file request, serve index.html
        file_path = self.translate_path(self.path)
        if not os.path.exists(file_path) and '.' not in os.path.basename(parsed_path.path):
            self.path = '/index.html'
        
        super().do_GET()

PORT = 5173
Handler = CustomHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Frontend server running at http://localhost:{PORT}")
        print(f"Backend API should be running at http://localhost:3001")
        print("Press Ctrl+C to stop the server")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)