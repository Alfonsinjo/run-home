import { describe, expect, it } from 'vitest';
import { mergeEntries, parseCsv, parseEntriesJson, parseExportJson, previewEntries, replaceEntries, toCsv, toExportJson } from './importer';
import { createInitialState } from './types';

describe('parseCsv', () => {
  it('reads semicolon CSV with German dates and decimal comma, skipping header', () => {
    const csv = 'Datum;km;Notiz\n01.01.2026;1,5;\n02.01.2026;0;Pause\n';
    expect(parseCsv(csv)).toEqual([
      { date: '2026-01-01', km: 1.5 },
      { date: '2026-01-02', km: 0, note: 'Pause' },
    ]);
  });
  it('reads comma CSV with ISO dates and decimal point', () => {
    expect(parseCsv('2026-03-05,2.25')).toEqual([{ date: '2026-03-05', km: 2.25 }]);
  });
  it('throws on bad rows with the line number', () => {
    expect(() => parseCsv('Datum;km\n32.01.2026;1')).toThrow(/Zeile 2/);
    expect(() => parseCsv('Datum;km\n01.01.2026;abc')).toThrow(/Zeile 2/);
    expect(() => parseCsv('')).toThrow(/keine Einträge/i);
  });
  it('rejects negative or absurd km', () => {
    expect(() => parseCsv('01.01.2026;-1')).toThrow(/Zeile 1/);
    expect(() => parseCsv('01.01.2026;500')).toThrow(/Zeile 1/);
  });
});

describe('parseEntriesJson / parseExportJson', () => {
  it('accepts a plain array', () => {
    expect(parseEntriesJson('[{"date":"2026-01-01","km":2}]')).toEqual([{ date: '2026-01-01', km: 2 }]);
  });
  it('accepts an export file and extracts entries', () => {
    const state = createInitialState();
    state.entries['2026-01-01'] = { date: '2026-01-01', km: 3 };
    expect(parseEntriesJson(toExportJson(state))).toEqual([{ date: '2026-01-01', km: 3 }]);
  });
  it('parseExportJson roundtrips and fills defaults', () => {
    const state = createInitialState();
    state.setupDone = true;
    state.entries['2026-02-02'] = { date: '2026-02-02', km: 1 };
    state.achieved['auto-50km'] = '2026-02-02';
    const parsed = parseExportJson(toExportJson(state));
    expect(parsed).toEqual(state);
    const minimal = parseExportJson('{"schemaVersion":1,"entries":{}}');
    expect(minimal.settings.targetKm).toBe(510);
    expect(minimal.setupDone).toBe(false);
  });
  it('rejects invalid files', () => {
    expect(() => parseExportJson('{"foo":1}')).toThrow(/Export-Datei/);
    expect(() => parseExportJson('not json')).toThrow(/JSON/);
    expect(() => parseEntriesJson('[{"date":"x","km":1}]')).toThrow(/Datum/);
  });
});

describe('preview / merge / replace / toCsv', () => {
  const incoming = [{ date: '2026-01-02', km: 5 }, { date: '2026-01-03', km: 1 }];
  it('previewEntries summarises', () => {
    expect(previewEntries(incoming)).toEqual({ count: 2, from: '2026-01-02', to: '2026-01-03', totalKm: 6 });
  });
  it('mergeEntries lets incoming win on the same date and keeps others', () => {
    const existing = { '2026-01-01': { date: '2026-01-01', km: 1 }, '2026-01-02': { date: '2026-01-02', km: 2, note: 'alt' } };
    const merged = mergeEntries(existing, incoming);
    expect(Object.keys(merged).sort()).toEqual(['2026-01-01', '2026-01-02', '2026-01-03']);
    expect(merged['2026-01-02']).toEqual({ date: '2026-01-02', km: 5 });
  });
  it('replaceEntries drops everything else', () => {
    expect(Object.keys(replaceEntries(incoming))).toEqual(['2026-01-02', '2026-01-03']);
  });
  it('toCsv writes German format sorted by date', () => {
    const csv = toCsv({ '2026-01-02': { date: '2026-01-02', km: 2.5, note: 'Regen' }, '2026-01-01': { date: '2026-01-01', km: 1 } });
    expect(csv).toBe('Datum;km;Notiz\n01.01.2026;1,00;\n02.01.2026;2,50;Regen\n');
  });
});
