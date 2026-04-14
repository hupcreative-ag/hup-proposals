#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy-assets.sh — Sincroniza a pasta assets/ com o VPS
# Uso: ./deploy-assets.sh
# ─────────────────────────────────────────────────────────────

VPS_USER="root"
VPS_IP="72.62.107.49"
REMOTE_PATH="/var/lib/easypanel/projects/hupcreative/hup-proposals/volumes/assets"
LOCAL_ASSETS="$(dirname "$0")/assets/"

echo "📦 Sincronizando assets para $VPS_IP..."
rsync -avz --progress \
  -e "ssh -o StrictHostKeyChecking=no" \
  "$LOCAL_ASSETS" \
  "$VPS_USER@$VPS_IP:$REMOTE_PATH"

echo "✅ Assets sincronizados com sucesso!"
