#!/usr/bin/env bash

set -euo pipefail

# Resolve repository root (script lives in backend/scripts)
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

BACKEND_TYPES_DIR="$ROOT_DIR/src/types"
FRONTEND_DIR="$ROOT_DIR/../valkku-frontend"
FRONTEND_TYPES_DIR="$FRONTEND_DIR/src/types"

# echo "📋 Syncing types from $BACKEND_TYPES_DIR -> $FRONTEND_TYPES_DIR"

if [[ ! -d "$FRONTEND_DIR" ]]; then
  echo "Error: Frontend directory not found at: $FRONTEND_DIR" >&2
  echo "Ensure 'valkku-frontend' exists next to 'valkku-backend'." >&2
  exit 1
fi

if [[ ! -d "$BACKEND_TYPES_DIR" ]]; then
  echo "Error: Backend types directory not found at: $BACKEND_TYPES_DIR" >&2
  exit 1
fi

mkdir -p "$FRONTEND_TYPES_DIR"

# Sync backend types -> frontend types (mirror contents)
rsync -a --delete "$BACKEND_TYPES_DIR/" "$FRONTEND_TYPES_DIR/"

echo "📋 Syncing types done"
