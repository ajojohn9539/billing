#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Building Billing App Frontend..."
cd "$DIR/frontend"
npm install
npm run build
