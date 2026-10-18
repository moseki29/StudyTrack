#!/usr/bin/env python3
"""Serve the Daily Targets static app locally, or on a trusted LAN with --lan."""
from __future__ import annotations

import argparse
import ipaddress
import socket
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = 8765


class AppHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".mjs": "text/javascript",
        ".webmanifest": "application/manifest+json",
    }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def list_directory(self, path):
        self.send_error(404, "Not found")
        return None

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "same-origin")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"{self.client_address[0]} - {fmt % args}")


def private_ipv4_addresses() -> list[str]:
    found: set[str] = set()
    try:
        for item in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            address = item[4][0]
            parsed = ipaddress.ip_address(address)
            if parsed.is_private and not parsed.is_loopback and not parsed.is_link_local:
                found.add(address)
    except OSError:
        pass
    return sorted(found)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lan", action="store_true", help="allow another device on the same network to open the app")
    parser.add_argument("--open", action="store_true", help="open the laptop's local app URL in the default browser")
    args = parser.parse_args()
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    server = ThreadingHTTPServer((host, PORT), partial(AppHandler))
    server.daemon_threads = True

    print("Daily Targets serves static app files only. Planner and uploaded files stay in each browser.")
    print(f"Laptop: http://127.0.0.1:{PORT}/")
    if args.lan:
        addresses = private_ipv4_addresses()
        if addresses:
            for address in addresses:
                print(f"Phone on the same trusted Wi-Fi: http://{address}:{PORT}/")
        else:
            print("No private IPv4 address found. Check the Wi-Fi connection and restart.")
        print("Keep this server and the laptop running while the phone uses the local address.")
        print("Do not use the LAN option on public Wi-Fi.")

    if args.open:
        webbrowser.open(f"http://127.0.0.1:{PORT}/")
    try:
        server.serve_forever(poll_interval=0.25)
    except KeyboardInterrupt:
        print("\nDaily Targets server stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
