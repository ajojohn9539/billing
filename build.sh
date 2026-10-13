#!/usr/bin/env bash
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Building Billing App Frontend..."
cd "$DIR/frontend"
npm run build
