#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo " Starting Apex Billing Full-Stack App     "
echo "=========================================="

# Start backend in background
cd "$DIR/backend"
./venv/bin/uvicorn main:app --host 127.0.0.1 --port 8100 --reload &
BACKEND_PID=$!
echo "Backend running (PID: $BACKEND_PID) on http://127.0.0.1:8100"

# Start frontend
cd "$DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5180 &
FRONTEND_PID=$!
echo "Frontend running (PID: $FRONTEND_PID) on http://127.0.0.1:5180"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT INT TERM
wait
