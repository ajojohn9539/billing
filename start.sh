#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PORT="${PORT:-8100}"
HOST="0.0.0.0"

echo "=========================================="
echo " Starting Rock Palace Aster Billing System"
echo " Host: $HOST, Port: $APP_PORT             "
echo "=========================================="

cd "$DIR/backend"

# Ensure requirements are present
if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
    echo "Installing backend requirements..."
    pip install -r requirements.txt 2>/dev/null || python3 -m pip install -r requirements.txt --break-system-packages 2>/dev/null || true
fi

# Run uvicorn on 0.0.0.0:$APP_PORT
if [ -f "./venv/bin/uvicorn" ]; then
    exec ./venv/bin/uvicorn main:app --host "$HOST" --port "$APP_PORT"
elif command -v uvicorn &> /dev/null; then
    exec uvicorn main:app --host "$HOST" --port "$APP_PORT"
else
    exec python3 -m uvicorn main:app --host "$HOST" --port "$APP_PORT"
fi
