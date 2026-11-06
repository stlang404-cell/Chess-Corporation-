#!/bin/sh
# Publish the PWA build to the deploy-only `gh-pages` branch (GitHub Pages serves it at
# https://stlang404-cell.github.io/Chess-Corporation-/). Source branches are untouched.
# Usage: scripts/deploy-pages.sh   (run tests first: npm test && npm run build)
set -e
cd "$(dirname "$0")/.."
npm run build
TMP=$(mktemp -d)
cp -r dist/. "$TMP/"
touch "$TMP/.nojekyll"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="SEVEN deploy" -c user.email="deploy@seven.invalid" commit -qm "Deploy SEVEN PWA $(date -u +%Y-%m-%dT%H:%MZ)"
git push -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
echo "Published. Pages updates within a minute or two."
