#!/bin/bash
# Script to update imports after refactoring

set -e

FRONTEND_DIR="/home/user/chatrealtime-monorepo/frontend"
cd "$FRONTEND_DIR"

echo "🔄 Mise à jour des imports..."

# 1. Update imports in lib/features/chat-v1
echo "📁 Mise à jour des imports V1..."
find lib/features/chat-v1 -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat'|from '../types'|g" \
  -e "s|from '@/lib/hooks/use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '../use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '../use-current-user'|from '@/lib/hooks/use-current-user'|g" \
  -e "s|from '@/lib/api/chat-client'|from '../api/chat-client'|g" \
  {} \;

# 2. Update imports in lib/features/chat-v2
echo "📁 Mise à jour des imports V2..."
find lib/features/chat-v2 -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat-v2'|from '../types'|g" \
  -e "s|from '@/types/product'|from '../types/product'|g" \
  -e "s|from '@/lib/hooks/use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '../use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '../../use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '../use-current-user'|from '@/lib/hooks/use-current-user'|g" \
  -e "s|from '../../use-current-user'|from '@/lib/hooks/use-current-user'|g" \
  -e "s|from '@/lib/api/chat-client-v2'|from '../api/product-chat-client'|g" \
  -e "s|from '@/lib/api/product-client'|from '@/lib/api/product-client'|g" \
  {} \;

# 3. Update imports in app/(protected)/chat (V1 pages)
echo "📁 Mise à jour des imports dans app/(protected)/chat..."
find app/\(protected\)/chat -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat'|from '@/lib/features/chat-v1'|g" \
  -e "s|from '@/lib/hooks/chat-v1/|from '@/lib/features/chat-v1/hooks/|g" \
  -e "s|from '@/lib/hooks/use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '@/lib/api/chat-client'|from '@/lib/features/chat-v1/api/chat-client'|g" \
  {} \;

# 4. Update imports in app/(protected)/marketplace-chat (V2 pages)
echo "📁 Mise à jour des imports dans app/(protected)/marketplace-chat..."
find app/\(protected\)/marketplace-chat -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat-v2'|from '@/lib/features/chat-v2'|g" \
  -e "s|from '@/lib/hooks/chat-v2/|from '@/lib/features/chat-v2/hooks/|g" \
  -e "s|from '@/lib/hooks/use-global-chat-notifications'|from '@/lib/features/chat-v2/hooks/use-global-notifications'|g" \
  -e "s|from '@/lib/hooks/use-mercure'|from '@/lib/features/shared'|g" \
  -e "s|from '@/lib/api/chat-client-v2'|from '@/lib/features/chat-v2/api/product-chat-client'|g" \
  {} \;

# 5. Update route paths /chat-v2 → /marketplace-chat
echo "📁 Mise à jour des routes /chat-v2 → /marketplace-chat..."
find app lib components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|/chat-v2|/marketplace-chat|g" \
  -e "s|'chat-v2'|'marketplace-chat'|g" \
  -e "s|\"chat-v2\"|\"marketplace-chat\"|g" \
  {} \;

# 6. Update imports in components/
echo "📁 Mise à jour des imports dans components/..."
find components -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat-v2'|from '@/lib/features/chat-v2'|g" \
  -e "s|from '@/lib/hooks/chat-v2/|from '@/lib/features/chat-v2/hooks/|g" \
  -e "s|from '@/lib/hooks/use-global-chat-notifications'|from '@/lib/features/chat-v2/hooks/use-global-notifications'|g" \
  {} \;

# 7. Update imports in lib/hooks/ (global hooks)
echo "📁 Mise à jour des imports dans lib/hooks/..."
find lib/hooks -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i \
  -e "s|from '@/types/chat-v2'|from '@/lib/features/chat-v2'|g" \
  -e "s|from '@/lib/api/product-client'|from '@/lib/api/product-client'|g" \
  {} \;

echo "✅ Mise à jour des imports terminée !"
