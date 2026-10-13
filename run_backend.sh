#!/usr/bin/env bash
# Start Python FastAPI Backend on Port 8100
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/backend"
echo "Starting Apex Billing Python Backend on http://127.0.0.1:8100..."
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8100 --reload
