#!/usr/bin/env bash
# Aufruf: scripts/release.sh 1.0.3 "Kurze Notiz"
# Setzt die Version, taggt vX.Y.Z und pusht. GitHub Actions baut dann APK, OTA-Bundle und latest.json.
set -euo pipefail
VERSION="${1:?Version fehlt, z. B. 1.0.3}"
NOTE="${2:-Release $VERSION}"
[ "$(git branch --show-current)" = main ] || { echo "Bitte auf main releasen"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Arbeitsbaum nicht sauber, erst committen"; exit 1; }
npm version "$VERSION" --no-git-tag-version >/dev/null
git add package.json package-lock.json
git commit -q -m "chore: Release v$VERSION – $NOTE"
git tag "v$VERSION"
git push origin main --tags
REPO=$(git remote get-url origin | sed -E 's#.*github.com[:/]##; s#\.git$##')
echo "Release v$VERSION gepusht. Build: https://github.com/$REPO/actions"
echo "APK danach unter: https://github.com/$REPO/releases/latest/download/run-home.apk"
