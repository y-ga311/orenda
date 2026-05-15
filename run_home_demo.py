#!/usr/bin/env python3
"""
Orenda フォルダをルートにしたローカルサーバーを立ち上げ、
home-interactive.html をブラウザで開きます（ログインボタン・ポップアップの動作確認用）。

使い方:
  cd /path/to/Orenda
  python3 run_home_demo.py

終了: このターミナルで Enter キーを押すとサーバーを止めます。
"""
from __future__ import annotations

import http.server
import os
import socketserver
import threading
import webbrowser

PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))


def main() -> None:
    os.chdir(ROOT)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{PORT}/home-interactive.html"
    print(f"サーバー起動: {url}")
    print("ブラウザを開いています…")
    webbrowser.open(url)
    print("終了するには Enter を押してください。")
    try:
        input()
    except (EOFError, KeyboardInterrupt):
        pass
    httpd.shutdown()
    print("停止しました。")


if __name__ == "__main__":
    main()
