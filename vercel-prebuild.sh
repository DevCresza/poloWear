#!/bin/bash
echo "🔧 Cleaning up problematic dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
echo "📦 Installing dependencies without optionals..."
npm install --omit=optional --no-audit --no-fund
echo "✅ Dependencies cleaned and installed successfully"