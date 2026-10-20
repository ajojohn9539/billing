#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=========================================================="
echo " Starting Render Full-Stack Build                        "
echo "=========================================================="

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Build frontend if node/npm is available
if command -v npm &> /dev/null; then
    echo "Building frontend dist..."
    cd "$DIR/frontend"
    npm install
    npm run build
    cd "$DIR"
    mkdir -p "$DIR/dist" "$DIR/build" "$DIR/backend/dist" "$DIR/backend/build"
    cp -r "$DIR/frontend/dist"/* "$DIR/dist/" 2>/dev/null || true
    cp -r "$DIR/frontend/dist"/* "$DIR/build/" 2>/dev/null || true
    cp -r "$DIR/frontend/dist"/* "$DIR/backend/dist/" 2>/dev/null || true
    cp -r "$DIR/frontend/dist"/* "$DIR/backend/build/" 2>/dev/null || true
fi

cd "$DIR/backend"

# If inside local dev and venv exists, activate it; on Render, Render manages its own venv
if [ -z "$VIRTUAL_ENV" ] && [ -d "venv" ]; then
    echo "Activating virtualenv..."
    source venv/bin/activate
fi

echo "Upgrading pip..."
pip install --upgrade pip 2>/dev/null || python3 -m pip install --upgrade pip --break-system-packages || true

echo "Installing backend dependencies from requirements.txt..."
pip install -r requirements.txt || python3 -m pip install -r requirements.txt --break-system-packages

echo "Build completed successfully!"
