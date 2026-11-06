#!/bin/sh
# Build both targets, serve the PWA, and run every browser end-to-end check.
set -e
cd "$(dirname "$0")/../.."
npm run release
npx vite preview --port 4179 --strictPort > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER' EXIT
sleep 2
URL=http://localhost:4179/
echo "== smoke";               node tests/e2e/smoke.mjs "$URL" .
echo "== resume";              node tests/e2e/resume.mjs "$URL"
echo "== animation";           node tests/e2e/animation.mjs "$URL"
echo "== review";              node tests/e2e/review.mjs "$URL" /tmp
echo "== offline+responsive";  node tests/e2e/offline-responsive.mjs "$URL"
echo "== file:// build";       node tests/e2e/file-protocol.mjs "$PWD/release/windows/SEVEN.html" file-protocol.png
