import { useState } from 'react';
import { Button, Card, useToast } from '@/components';
import seed from '@/data/seed-2026.json';
import { parseCsv, parseEntriesJson, parseExportJson, previewEntries, toCsv, toExportJson, type ImportPreview } from '@/domain/importer';
import { formatKm } from '@/domain/progress';
import type { AppState, DayEntry } from '@/domain/types';
import { exportTextFile, pickTextFile } from '@/services/files';
import { clearState } from '@/services/storage';
import { pickAppState, useAppStore } from '@/store/useAppStore';

export function DataSection() {
  const toast = useToast((s) => s.show);
  const store = useAppStore();
  const [pending, setPending] = useState<{ entries: DayEntry[]; preview: ImportPreview; fullState?: AppState } | null>(null);

  const exportJson = () => exportTextFile(`run-home-export-${new Date().toISOString().slice(0, 10)}.json`, toExportJson(pickAppState(store)), 'application/json');
  const exportCsv = () => exportTextFile(`run-home-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(store.entries), 'text/csv');

  const importFile = async () => {
    const f = await pickTextFile('.csv,.json,text/csv,application/json');
    if (!f) return;
    try {
      if (f.name.toLowerCase().endsWith('.json')) {
        try {
          const full = parseExportJson(f.text);
          setPending({ entries: Object.values(full.entries), preview: previewEntries(Object.values(full.entries)), fullState: full });
          return;
        } catch {
          /* kein Export, vielleicht eine reine Liste */
        }
        const list = parseEntriesJson(f.text);
        setPending({ entries: list, preview: previewEntries(list) });
      } else {
        const list = parseCsv(f.text);
        setPending({ entries: list, preview: previewEntries(list) });
      }
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

  const apply = (mode: 'merge' | 'replace' | 'full') => {
    if (!pending) return;
    if (mode === 'full' && pending.fullState) store.importState(pending.fullState);
    else store.importEntries(pending.entries, mode === 'full' ? 'replace' : mode);
    toast(`${pending.preview.count} Einträge importiert.`, 'success');
    setPending(null);
  };

  const reset = async () => {
    if (!window.confirm('Wirklich alle Daten löschen? Ein Export vorher ist empfehlenswert.')) return;
    await clearState();
    store.resetAll();
    toast('Alle Daten gelöscht.');
  };

  return (
    <Card title="Daten">
      <div className="grid-2">
        <Button variant="secondary" onClick={exportJson}>Export JSON</Button>
        <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
      </div>
      <Button variant="secondary" onClick={importFile}>Datei importieren (CSV/JSON)</Button>
      <Button variant="secondary" onClick={() => { const list = seed as DayEntry[]; setPending({ entries: list, preview: previewEntries(list) }); }}>Laufliste 2026 laden</Button>
      {pending && (
        <div className="card" style={{ background: 'var(--surface-2)' }}>
          <div className="pill accent">{pending.preview.count} Tage · {pending.preview.from} bis {pending.preview.to} · {formatKm(pending.preview.totalKm)}</div>
          <p className="muted">Zusammenführen: gleiche Tage werden überschrieben, andere bleiben. Ersetzen: alle bisherigen Einträge werden gelöscht.</p>
          <div className="grid-2">
            <Button onClick={() => apply('merge')}>Zusammenführen</Button>
            <Button variant="danger" onClick={() => apply('replace')}>Ersetzen</Button>
          </div>
          {pending.fullState && <Button variant="secondary" onClick={() => apply('full')}>Kompletten Export wiederherstellen (inkl. Einstellungen)</Button>}
          <Button variant="ghost" onClick={() => setPending(null)}>Abbrechen</Button>
        </div>
      )}
      <Button variant="danger" onClick={reset}>Alle Daten löschen</Button>
    </Card>
  );
}
