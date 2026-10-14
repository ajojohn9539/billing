#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=========================================================="
echo " Starting Render Backend Build: Rock Palace Aster Billing "
echo "=========================================================="

# If inside local dev and venv exists, activate it; on Render, Render manages its own venv
if [ -z "$VIRTUAL_ENV" ] && [ -d "venv" ]; then
    echo "Activating virtualenv..."
    source venv/bin/activate
fi

echo "Upgrading pip..."
pip install --upgrade pip 2>/dev/null || python3 -m pip install --upgrade pip --break-system-packages || true

echo "Installing backend dependencies from requirements.txt..."
pip install -r requirements.txt || python3 -m pip install -r requirements.txt --break-system-packages

echo "Backend build completed successfully!"
