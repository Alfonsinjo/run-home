#!/usr/bin/env bash
# Aufruf: scripts/release.sh 1.0.1 "Kurze Notiz"
set -euo pipefail
VERSION="${1:?Version fehlt, z. B. 1.0.1}"
NOTE="${2:-Release $VERSION}"
npm version "$VERSION" --no-git-tag-version >/dev/null
git add package.json package-lock.json
git commit -m "chore: Release v$VERSION – $NOTE

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git tag "v$VERSION"
git push origin main --tags
echo "Release v$VERSION gepusht. GitHub Actions baut APK und OTA-Bundle: https://github.com/$(git remote get-url origin | sed -E 's#.*github.com/##; s#\.git$##')/actions"
