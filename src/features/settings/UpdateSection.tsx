import { useState } from 'react';
import { Button, Card } from '@/components';
import { isNative } from '@/services/platform';
import { applyDownloadedUpdate, checkForUpdate, currentBundleVersion, type UpdateStatus } from '@/services/updater';

export function UpdateSection() {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setBusy(true);
    setStatus({ state: 'checking', message: 'Prüfe…' });
    setStatus(await checkForUpdate());
    setBusy(false);
  };
  return (
    <Card title="Updates" action={<span className="pill num">v{currentBundleVersion()}</span>}>
      <p className="muted">Fehlerbehebungen kommen als Over-the-Air-Update ohne neue APK.{isNative() ? '' : ' Im Browser nur Anzeige.'}</p>
      <Button variant="secondary" onClick={check} disabled={busy}>Jetzt auf Updates prüfen</Button>
      {status && <p className={status.state === 'error' ? '' : 'muted'} style={status.state === 'error' ? { color: 'var(--warn)' } : undefined}>{status.message}</p>}
      {status?.state === 'downloaded' && <Button onClick={applyDownloadedUpdate}>Jetzt neu starten und aktivieren</Button>}
    </Card>
  );
}
