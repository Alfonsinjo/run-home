# Run Home

Persönlicher Lauf-Tracker: jeden Tag Kilometer eintragen und auf der Karte sehen, wie weit du auf der Strecke zu deinen Eltern schon bist. Mit Meilensteinen, Fun Facts (mit Quellen), Wochenziel, Erinnerungen und Over-the-Air-Updates.

**Installieren:** [run-home.apk](https://github.com/Alfonsinjo/run-home/releases/latest/download/run-home.apk) aufs Handy laden, öffnen, „Unbekannte Quellen“ einmalig erlauben, fertig. Keine Konten, keine Schlüssel, alle Daten bleiben auf dem Gerät. Alle Releases: [Releases](https://github.com/Alfonsinjo/run-home/releases).

## Screenshots

| Start | Verlauf |
| --- | --- |
| ![Start](docs/screenshots/home.png) | ![Verlauf](docs/screenshots/history.png) |

| Ziele | Einstellungen |
| --- | --- |
| ![Ziele](docs/screenshots/milestones.png) | ![Einstellungen](docs/screenshots/settings.png) |

Vorher/Nachher-Vergleich der Design-Politur: [docs/screenshots/README.md](docs/screenshots/README.md). Die Karte nutzt OpenStreetMap-Kacheln, die per CSS-Filter abgedunkelt werden.

## Am Windows-PC testen (WSL)

```bash
cd ~/workspace/run-home
npm install
npm run dev
```
Dann im Windows-Browser `http://localhost:5173` öffnen, F12 → Geräte-Modus (z. B. Pixel 7). Erinnerungen und OTA sind im Browser Stubs; die Einstellungen zeigen eine Web-Vorschau.

Tests: `npm test` · Typen: `npm run typecheck` · Seed aus der Excel neu erzeugen: `npm run seed`

Screenshots neu erzeugen (Dev-Server muss laufen, Playwright und Chromium müssen installiert sein):
```bash
npm install -D playwright@1.63.0 && ./node_modules/.bin/playwright install chromium
OUT_DIR=docs/screenshots node scripts/screenshots.mjs
```
`OUT_DIR` ist optional (Standard `docs/screenshots`), `BASE_URL` ebenfalls (Standard `http://localhost:5173`).

## Android-APK

Jeder Tag `vX.Y.Z` löst den GitHub-Actions-Workflow „Release“ aus. Ergebnis im Release: `run-home.apk` (direkt installierbar), `dist.zip` (OTA-Bundle), `latest.json`. Der `versionCode` wird aus der Version abgeleitet (1.0.2 → 10002), damit jedes Release als Update über das vorherige installierbar ist.

Der Workflow nutzt das auf dem Runner vorinstallierte Android SDK und JDK 21 (Temurin); fehlende SDK-Pakete werden per `sdkmanager` nachgeladen.

Release erzeugen (auf `main`, sauberer Arbeitsbaum):
```bash
scripts/release.sh 1.0.3 "Was sich geändert hat"
```
Das Skript setzt die Version in `package.json`, committet, taggt und pusht. Der Build dauert etwa 10 Minuten.

### Signatur einrichten (einmalig, vor dem ersten Release)
Ohne Signatur-Secrets baut der Workflow eine Debug-APK mit jedes Mal neuem Zufallsschlüssel. Dann lässt sich kein Update über die installierte App installieren, nur Deinstallieren mit Datenverlust. Deshalb vorher einmal den Release-Schlüssel hinterlegen; danach sind alle APKs mit demselben Schlüssel signiert und direkt updatefähig.

Lokal mit JDK und [gh](https://cli.github.com) (`gh auth login`):
```bash
mkdir -p ~/.run-home
keytool -genkeypair -keystore ~/.run-home/release.keystore -alias runhome -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Run Home, O=Run Home, C=DE"        # Passwort merken, für Keystore und Key dasselbe nehmen
base64 -w0 ~/.run-home/release.keystore | gh secret set ANDROID_KEYSTORE_BASE64
gh secret set ANDROID_KEYSTORE_PASSWORD        # Passwort eingeben
gh secret set ANDROID_KEY_PASSWORD             # dasselbe Passwort
gh secret set ANDROID_KEY_ALIAS --body runhome
```
Keystore und Passwort sicher aufbewahren: Geht der Schlüssel verloren, lassen sich spätere APKs nicht mehr als Update installieren.

Alternative ohne lokales JDK: GitHub → Actions → „Keystore erzeugen (einmalig)“ → Run workflow mit Passwort, Artifact `keystore` laden und den Inhalt von `keystore.b64` als Secret `ANDROID_KEYSTORE_BASE64` eintragen, dazu die drei Passwort-/Alias-Secrets wie oben.

## Over-the-Air-Updates
Die App lädt beim Start `latest.json` aus dem neuesten Release dieses Repos. Ist die Version neuer als die laufende, wird `dist.zip` geladen und beim nächsten Wechsel in den Hintergrund aktiviert. Reine Web-Änderungen brauchen keine neue APK. Nach nativen Änderungen (neues Capacitor-Plugin, Manifest) `minNativeVersion` im Workflow anheben und die APK neu installieren.

## Daten
Alles liegt lokal auf dem Gerät. Einstellungen → Daten: Export als JSON (komplett) oder CSV, Import mit Vorschau (Zusammenführen/Ersetzen). Die Excel „Laufliste 2026" ist als Seed eingebaut (`src/data/seed-2026.json`).

## Fun Facts
`src/data/funfacts.de.json`: `km`, `title`, `text`, `source`. Neue Fakten nur mit Quelle ergänzen; `npm test` prüft Sortierung und Pflichtfelder.
