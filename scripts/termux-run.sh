#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Install Node.js first: pkg update && pkg install nodejs-lts"
  exit 1
fi
node -e "const major=Number(process.versions.node.split('.')[0]);if(major<20){console.error('BROKENGPT needs Node.js 20 or newer. Current:',process.version);process.exit(1)}"
cd "$BACKEND_DIR"
if [ ! -f .env ]; then
  KEY="$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")"
  printf 'BROKENGPT_ENCRYPTION_KEY=%s\n' "$KEY" > .env
  chmod 600 .env 2>/dev/null || true
  echo "Created backend/.env with a private local key. Keep it secret."
fi
npm install
printf '\nStarting BROKENGPT at http://127.0.0.1:3000\nPress Ctrl+C to stop.\n\n'
npm start
