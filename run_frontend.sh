#!/usr/bin/env bash
# Start Vite + React Frontend on Port 5180
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR/frontend"
echo "Starting Apex Billing React Frontend on http://127.0.0.1:5180..."
npm run dev -- --host 127.0.0.1 --port 5180
