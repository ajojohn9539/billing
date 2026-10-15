#!/usr/bin/env python3
"""
JR Marbles & Granites (Chengamanadu) — Automated Daily Cron Backup Daemon
Generates daily XML backup, stores to disk, sends email to ajojohn.dev@gmail.com,
syncs with Google Drive, and optionally cleans previous date records.
"""
import sys
import os
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from dotenv import load_dotenv
load_dotenv(BASE_DIR / ".env")
load_dotenv(BASE_DIR.parent / ".env")
load_dotenv()

from routes.backup_router import run_daily_backup

def main():
    print(f"[{datetime.now().isoformat()}] Starting JR Marbles & Granites Daily Backup Daemon...")
    try:
        res = run_daily_backup()
        print(f"[{datetime.now().isoformat()}] Backup Completed Successfully!")
        print(f"File Name: {res['file_name']} ({res['file_size_kb']} KB)")
        print(f"Target Email: {res['recipient']} ({res['email_delivery']})")
        print(f"Google Drive: {res['google_drive_folder']}")
        print(f"Cleared Records: {res['cleared_records']}")
    except Exception as e:
        print(f"[{datetime.now().isoformat()}] ERROR during backup execution: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
