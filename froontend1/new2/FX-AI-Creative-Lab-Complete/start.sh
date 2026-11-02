#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then npm install; fi
if [ ! -f backend/.env ]; then cp backend/.env.example backend/.env; fi
npm run dev
