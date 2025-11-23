#!/bin/bash
# Script to replace 'interface' with 'type' in TypeScript files

set -e

FRONTEND_DIR="/home/user/chatrealtime-monorepo/frontend"
cd "$FRONTEND_DIR"

echo "🔧 Remplacement des interfaces par types..."

# Find and replace "export interface X {" → "export type X = {"
find lib/features types -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e 's/^export interface \([A-Za-z0-9_]*\) {/export type \1 = {/g' \
  -e 's/^interface \([A-Za-z0-9_]*\) {/type \1 = {/g' \
  {} \;

echo "✅ Remplacement terminé !"

# Show what was changed
echo "📋 Fichiers modifiés :"
find lib/features types -type f \( -name "*.ts" -o -name "*.tsx" \) -exec grep -l "^export type.*= {" {} \; | head -10
