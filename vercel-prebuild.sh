#!/bin/bash
echo "🔧 Cleaning up problematic dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
echo "📦 Installing dependencies without optionals..."
npm install --omit=optional --no-audit --no-fund
echo "🔧 Installing platform-specific Rollup dependency..."
npm install @rollup/rollup-linux-x64-gnu --no-save
echo "✅ Dependencies cleaned and installed successfully"