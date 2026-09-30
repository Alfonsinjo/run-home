# Run Home – Design-Spezifikation

Datum: 2026-09-29
Status: freigegeben (Design im Chat abgestimmt)

## 1. Ziel und Kontext

Persönliche Android-App, die die seit 01.01.2026 täglich gelaufenen Kilometer erfasst und
den Fortschritt auf der Strecke „Zuhause → Eltern" (510 km, Deadline 31.12.2026) gamifiziert
darstellt. Die App soll motivieren, jeden Tag zu laufen und dranzubleiben.

Bestehende Daten: `Laufliste 2026.xlsx`, Blatt `2026` (Spalten Datum, Zu laufende KM,
Gelaufene KM, Soll-Stand, Ist-Stand, Differenz). Stand 28.09.2026: 341,7 km gelaufen,
Soll 378,7 km, 149 von 271 Tagen mit 0 km. Blatt `20262` und ältere Blätter werden ignoriert.

Nutzer: eine Person, Sprache der App: Deutsch.

## 2. Entscheidungen (mit dem Nutzer abgestimmt)

| Thema | Entscheidung |
|---|---|
| Stack | Capacitor 8 + React 19 + TypeScript + Vite, Leaflet via react-leaflet |
| Karte | OSM-Daten, Kacheln vom OSM-Standard-Tileserver mit CSS-Dunkelfilter (kein API-Key; CARTO verlangt seit 28.08.2026 einen Key), Route via öffentlichem OSRM-Server, Adresssuche via Nominatim |
| Daten | Nur lokal (Capacitor Preferences / localStorage), Export/Import als JSON |
| Ziel | Standard 510 km bis 31.12.2026, Startdatum 01.01.2026; alles in den Einstellungen änderbar |
| Tagesziel | Standard „Aufhol-Tempo" (Rest-km / Rest-Tage); Alternativen „Fester Plan" (Ziel / Gesamttage) und „Eigener Wert" |
| Design | Nike-Run-Club-Stil: dunkles Theme, große Zahlen, ein Akzent (Volt-Grün) |
| Build/OTA | GitHub Actions baut APK + Web-Bundle je Release; OTA über `@capgo/capacitor-updater` im No-Cloud-Modus (Bundle-URL aus `latest.json` eines GitHub-Release) |
| App-Name | Run Home, App-ID `de.stabel.runhome` |
| Standorte | Werden vom Nutzer im Setup eingetragen; Platzhalter für den PC-Test: Frankfurt am Main → Hamburg |

## 3. Architektur

```
src/
  app/            Routing (Bottom-Tabs), Provider, Theme
  domain/         Reine Logik ohne UI, vollständig getestet
    progress.ts   Summen, Rest-km, Prozent, Soll/Ist, Plus/Minus
    goals.ts      Tagesziel-Modi, Wochenziel, Streak
    milestones.ts Automatische + manuelle Meilensteine, erreicht/offen
    funfacts.ts   Fun-Fact-Auswahl nach km-Schwelle
    route.ts      Position auf der Route (Interpolation entlang Polyline), Haversine
    importer.ts   CSV/JSON-Import und -Export, Excel-Seed
  data/
    funfacts.de.json   Fun Facts mit km, Text, Quelle
    seed-2026.json     Aus der Excel erzeugte Tageseinträge
  services/       Plattform-Adapter mit Web-Fallback
    storage.ts    Preferences (nativ) / localStorage (Web)
    notifications.ts  LocalNotifications (nativ) / Stub mit Log (Web)
    updater.ts    Capgo-Updater (nativ) / Stub (Web)
    geocoding.ts  Nominatim-Suche
    routing.ts    OSRM-Route, Fallback Luftlinie
  store/          Zustand-Store (entries, settings, ui), Persistenz
  features/
    setup/        Einrichtungs-Assistent
    home/         Karte, Fortschritt, Tagesziel, Wochenziel, Streak, Fun Fact
    entry/        Eintragen/Bearbeiten, Feier-Ansicht
    history/      Verlauf, Monatsübersicht
    milestones/   Zeitstrahl
    settings/     Einstellungen, Export/Import, Update, Test-Buttons
  components/     Design-System (Button, Card, Stat, ProgressBar, Sheet, Tabs)
scripts/
  excel-to-seed.py   Erzeugt data/seed-2026.json aus der Excel
android/           Capacitor-Android-Projekt (generiert)
.github/workflows/ release.yml
```

Grundsätze:
- `domain/` hat keine Abhängigkeit auf React, Capacitor oder Browser-APIs und wird mit Vitest getestet.
- `services/` kapselt Plattform-Unterschiede. Jede Funktion prüft `Capacitor.isNativePlatform()` und hat einen Web-Fallback, damit die App im Browser vollständig bedienbar ist.
- Ein Store (Zustand) hält `entries`, `settings`, `route` und `achievedIds`; jede Änderung wird sofort persistiert.

## 4. Datenmodell

```ts
type DayEntry = { date: string /* YYYY-MM-DD */; km: number; note?: string };

type Place = { label: string; lat: number; lon: number };

type Milestone = {
  id: string;            // "auto-50km", "auto-pct-25", "manual-<uuid>"
  kind: 'auto' | 'manual';
  km: number;            // Position auf der Strecke
  title: string;
  description?: string;
};

type FunFact = {
  id: string;
  km: number;            // Schwelle
  title: string;
  text: string;          // Erklärung, deutsch
  source: string;        // URL
};

type Settings = {
  home: Place | null;
  parents: Place | null;
  targetKm: number;              // Standard 510
  startDate: string;             // Standard 2026-01-01
  deadline: string;              // Standard 2026-12-31
  dailyGoalMode: 'catchup' | 'plan' | 'custom';
  customDailyKm: number;         // nur bei 'custom'
  reminderEnabled: boolean;
  reminderTime: string;          // "19:00"
  secondReminderEnabled: boolean;
  secondReminderTime: string;    // "21:00"
  manualMilestones: Milestone[];
  routeMode: 'osrm' | 'straight';
};

type RouteData = { coords: [number, number][]; lengthKm: number; fetchedAt: string } | null;

type AppState = {
  setupDone: boolean;
  entries: Record<string, DayEntry>;   // key = date
  settings: Settings;
  route: RouteData;
  achieved: Record<string, string>;    // milestone/funfact id -> Datum des Erreichens
  schemaVersion: number;
};
```

Persistenz: ein JSON-Dokument unter dem Schlüssel `runhome.state`. `schemaVersion` erlaubt
spätere Migrationen. Export = dieses Dokument als Datei, Import = Validierung + Ersetzen
oder Zusammenführen (Einträge pro Datum, neuere Datei gewinnt).

## 5. Berechnungen (domain)

- `totalKm = Σ entries.km` (nur Einträge ab `startDate`).
- `remainingKm = max(0, targetKm − totalKm)`, `percent = totalKm / targetKm`.
- `daysTotal = Tage von startDate bis deadline inkl.`, `daysElapsed`, `daysRemaining = Tage von morgen bis deadline inkl.` (heute zählt nicht mit, weil der heutige Lauf abends eingetragen wird; vor dem Start ab `startDate`, nach der Deadline 0).
- Plan-Soll bis heute: `targetKm / daysTotal × daysElapsed`; Plus/Minus = `totalKm − Soll` (wie Excel).
- Tagesziel (in allen drei Modi auf 0,1 km gerundet, mindestens 0):
  - `catchup`: `remainingKm / daysRemaining`. Am Deadline-Tag (`daysRemaining = 0`) ist das Tagesziel die gesamte Restdistanz. Nach der Deadline ist es 0; die Startseite zeigt dann „Deadline vorbei – jeder Kilometer zählt" und es werden keine Erinnerungen mehr geplant.
  - `plan`: `targetKm / daysTotal`.
  - `custom`: `customDailyKm`.
- Wochenziel = `7 × Tagesziel`; Woche = Montag–Sonntag der aktuellen Woche; Anzeige gelaufen/Wochenziel und sieben Tagespunkte (erfüllt / teilweise / leer / zukünftig).
- Streak = Anzahl aufeinanderfolgender Tage mit `km > 0`, rückwärts ab heute (heute ohne Eintrag zählt noch nicht als Bruch, gestern ohne Eintrag schon).
- Prognose: bei aktuellem Durchschnitt der letzten 28 Tage voraussichtliches Ankunftsdatum.
- Position auf der Route: kumulierte Segmentlängen der Polyline (Haversine), Punkt bei `totalKm` linear interpoliert; liegt `totalKm` über der Routenlänge, Position = Ziel. Wenn Routenlänge ≠ targetKm, wird proportional skaliert (`totalKm / targetKm × lengthKm`).

## 6. Karte und Route

- Leaflet mit OSM-Standardkacheln `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (Attribution: OpenStreetMap-Mitwirkende), Kachel-Ebene per CSS-Filter abgedunkelt, Marker und Linien bleiben ungefiltert.
- Beim Speichern von Zuhause/Eltern im Setup wird die Route über OSRM (`router.project-osrm.org`, Profil `driving`, `overview=full`, `geometries=geojson`) geholt und lokal gespeichert. Fehler oder Timeout → Luftlinie (Great-Circle-Linie mit 64 Zwischenpunkten) und Hinweis. In den Einstellungen kann die Route neu berechnet werden.
- Ebenen: gelaufener Teil der Route in Volt-Grün, offener Teil grau; Marker Zuhause, Eltern (Haus-Icon), aktuelle Position (pulsierender Punkt), Meilensteine (kleine Pins, erreichte gefüllt). Tippen auf einen Pin zeigt Name, km und Rest-km.
- Home-Karte ist interaktiv (Zoom/Pan), Button „Zentrieren" zoomt auf die ganze Route.

## 7. Gamification

Automatische Meilensteine (aus `targetKm` erzeugt):
- Jede 50 km (50, 100, …, bis < targetKm).
- Prozentmarken 10 %, 25 %, 50 % („Halbzeit"), 75 %, 90 %, 100 % („Angekommen!").

Manuelle Meilensteine: Titel + km-Position, optional Beschreibung. Im Setup und in den
Einstellungen anlegbar; Position kann auch durch Tippen auf die Route gewählt werden (nächster
Routenpunkt → km).

Fun Facts (`data/funfacts.de.json`): mindestens 25 Einträge mit belegbarer Quelle, verteilt
über 1 bis 600 km. Jeder Fakt enthält die Quelle (URL); Fakten ohne belastbare Quelle werden
nicht aufgenommen. Beispiele für Kandidaten: Halbmarathon 21,0975 km, Marathon 42,195 km,
Ärmelkanal Dover–Calais ≈ 33 km, Ironman gesamt 226 km, Spartathlon 246 km,
Bodensee-Umrundung ≈ 273 km, 24-Stunden-Weltrekord Laufen ≈ 320 km.

Erreichen: Nach jedem Speichern wird `totalKm` gegen alle noch nicht erreichten Meilensteine und
Fakten geprüft. Neu erreichte werden in `achieved` mit Datum vermerkt und in einer Feier-Ansicht
(Konfetti-Animation, Titel, Text, Quelle) gezeigt, mehrere nacheinander. Auf Home wird immer der
zuletzt erreichte Fakt und der nächste Meilenstein mit Rest-km angezeigt.

Motivationstexte: kleiner Pool deutscher Sätze abhängig von Situation (Streak läuft, Rückstand,
Vorsprung, Tag ohne Eintrag), auf Home und in Notifications.

## 8. Erinnerungen (Notifications)

- Beim Setup und beim Aktivieren wird die Berechtigung angefragt (Android 13+).
- Tägliche Notification zur `reminderTime` mit `schedule.on = { hour, minute }`, Kanal „Erinnerungen".
- Optional zweite Notification zur `secondReminderTime`.
- Beim Speichern eines Eintrags für heute: die heutigen Notifications werden gecancelt und ab morgen neu geplant.
- Text rotiert durch den Motivationspool, enthält Tagesziel und Rest-km.
- Web: `services/notifications.ts` protokolliert nur; Einstellungen zeigen „Test-Benachrichtigung senden", das im Browser eine In-App-Toast-Vorschau zeigt.

## 9. Build, Release und OTA

- GitHub-Repo (privat) `run-home`, Standardbranch `main`.
- Workflow `release.yml` bei Tag `v*.*.*`:
  1. `npm ci`, `npm test`, `npm run build`.
  2. `dist.zip` aus `dist/` erzeugen.
  3. `npx cap sync android`, Gradle `assembleRelease`, signiert mit einem Keystore aus GitHub-Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`). Fehlen die Secrets, wird eine Debug-APK gebaut.
  4. Release im privaten Repo anlegen mit `run-home.apk`, `dist.zip`, `latest.json` (`{ version, url, minNativeVersion, notes }`).
  5. Dieselben Artefakte zusätzlich im öffentlichen Repo `run-home-releases` veröffentlichen (Token-Secret `RELEASES_TOKEN`), weil die App ohne Token keine Assets aus einem privaten Repo laden kann. Der Schritt ist idempotent: ein vorhandenes Release wird wiederverwendet und seine gleichnamigen Assets ersetzt, ein neues wird erst als Entwurf angelegt und nach dem Upload veröffentlicht.
- OTA in der App (`services/updater.ts`, nur nativ):
  1. Beim Start `notifyAppReady()`.
  2. `latest.json` von der festen Release-URL `https://github.com/<owner>/run-home-releases/releases/latest/download/latest.json` (öffentliches Repo) laden.
  3. Wenn `version` neuer als die laufende Bundle-Version und `minNativeVersion` ≤ installierte native Version: `download({ version, url })`, dann `set()` beim nächsten Wechsel in den Hintergrund oder sofort per Button in den Einstellungen.
  4. Fehlgeschlagene Updates rollen automatisch zurück (Capgo-Mechanik).
- Versionierung: `package.json`-Version ist die Bundle-Version; native `versionCode` wird nur bei nativen Änderungen erhöht.
- Das Repo für Actions liegt unter dem GitHub-Konto, für das in `~/.git-credentials` ein Token hinterlegt ist. Das Anlegen des Remotes geschieht nach Rücksprache im Implementierungsplan.

## 10. Excel-Import

- `scripts/excel-to-seed.py` liest Blatt `2026`, nimmt alle Zeilen mit gefülltem „Gelaufene KM" und schreibt `src/data/seed-2026.json` als `DayEntry[]`.
- Setup-Schritt „Bestehende Daten": Button „Laufliste 2026 übernehmen" (importiert den Seed) oder „Datei importieren" (JSON/CSV mit Spalten `Datum;km`).
- Einstellungen → „Daten": Export JSON (Share-Sheet nativ, Download im Web), Import JSON/CSV mit Vorschau (Anzahl Einträge, Zeitraum, Summe) und Wahl „Ersetzen" oder „Zusammenführen".

## 11. Design-System

- Farben: Hintergrund `#0B0B0C`, Fläche `#161618`, Fläche erhöht `#1F1F22`, Text `#FFFFFF`, Text gedämpft `#9A9AA0`, Akzent Volt `#D4FF3A`, Erfolg `#5CFF9D`, Warnung `#FFB84D`, Fehler `#FF5C5C`.
- Typografie: System-Sans (Roboto auf Android), Zahlen in `font-variant-numeric: tabular-nums`; Display-Größen 56/40 px für Hauptzahlen, 20 px Titel, 15 px Fließtext, 12 px Labels in Großbuchstaben mit Letterspacing.
- Komponenten: `Card` (Radius 20 px), `Stat` (Wert groß, Label klein), `ProgressBar` (Track grau, Fill Volt, Marker für Meilensteine), `WeekDots`, `Button` (primär Volt auf Schwarz, sekundär Umriss), `Sheet` (Bottom-Sheet für Eintragen), `Tabs` (Bottom-Navigation mit 4 Tabs).
- Safe-Area-Insets werden respektiert, alles auf 360–430 px Breite ausgelegt, Touch-Ziele ≥ 44 px.

## 12. Fehlerbehandlung

- Netzwerkfehler bei Nominatim/OSRM: Meldung im UI, Retry-Button, Luftlinien-Fallback; App bleibt voll nutzbar.
- Ungültige Eingaben (km < 0, > 200, Datum in der Zukunft): Validierung im Formular.
- Import: Schema-Validierung, bei Fehlern Abbruch mit Meldung, nie Teil-Import.
- Storage-Fehler: Fehlermeldung mit Hinweis auf Export; Schreibfehler blockieren die UI nicht.
- OTA: alle Fehler nur geloggt und in Einstellungen als Status sichtbar; nie blockierend.

## 13. Tests und Abnahme

- Vitest für `domain/` (Fortschritt, Tagesziel-Modi, Streak, Wochenziel, Meilensteine, Fun-Fact-Auswahl, Routen-Interpolation, Import/Export-Roundtrip) und für den Excel-Seed (Summe 341,7 km bis 28.09.2026).
- Playwright-Screenshots der Hauptscreens im Handy-Viewport (390 × 844) als Sichtprüfung für den Nutzer.
- Manuelle Abnahme am PC: `npm run dev` in WSL, Aufruf im Windows-Browser, Setup durchlaufen, Seed importieren, Eintrag speichern, Feier-Ansicht, Export/Import.
- Nicht im Umfang: iOS, Cloud-Sync, GPS-Tracking während des Laufs, Mehrbenutzer.
