// Erzeugt latest.json für ein Release. Aufruf: node scripts/make-latest-json.mjs <owner> <version> [minNativeVersion] [notes]
import { writeFileSync } from 'node:fs';
const [owner, version, minNativeVersion = '1.0.0', notes = ''] = process.argv.slice(2);
if (!owner || !version) { console.error('usage: make-latest-json.mjs <owner> <version> [minNativeVersion] [notes]'); process.exit(1); }
const latest = { version, url: `https://github.com/${owner}/run-home-releases/releases/download/v${version}/dist.zip`, minNativeVersion, notes };
writeFileSync('latest.json', JSON.stringify(latest, null, 2));
console.log(latest);
