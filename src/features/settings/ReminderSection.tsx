import { Button, Card, Field, useToast } from '@/components';
import { ensureNotificationPermission, getWebPlanPreview, sendTestNotification } from '@/services/notifications';
import { isNative } from '@/services/platform';
import { useAppStore } from '@/store/useAppStore';

export function ReminderSection() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const toast = useToast((s) => s.show);
  const toggle = async (on: boolean) => {
    if (on && !(await ensureNotificationPermission())) { toast('Benachrichtigungen sind nicht erlaubt. Bitte in den Android-Einstellungen freigeben.', 'error'); return; }
    update({ reminderEnabled: on });
  };
  const test = async () => {
    try {
      await sendTestNotification();
      const preview = getWebPlanPreview();
      toast(isNative() ? 'Test-Benachrichtigung kommt in 3 Sekunden.' : preview.length ? `Web-Vorschau: nächste Erinnerung ${preview[0].at.toLocaleString('de-DE')} – „${preview[0].body}"` : 'Web-Vorschau: aktuell keine Erinnerung geplant (heute schon eingetragen?).', 'success');
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };
  return (
    <Card title="Erinnerungen">
      <label className="row between"><span>Täglich erinnern, wenn nichts eingetragen ist</span><input type="checkbox" style={{ width: 24, height: 24 }} checked={settings.reminderEnabled} onChange={(e) => void toggle(e.target.checked)} /></label>
      {settings.reminderEnabled && (
        <>
          <Field label="Uhrzeit"><input type="time" value={settings.reminderTime} onChange={(e) => update({ reminderTime: e.target.value })} /></Field>
          <label className="row between"><span>Zweite Erinnerung</span><input type="checkbox" style={{ width: 24, height: 24 }} checked={settings.secondReminderEnabled} onChange={(e) => update({ secondReminderEnabled: e.target.checked })} /></label>
          {settings.secondReminderEnabled && <Field label="Zweite Uhrzeit"><input type="time" value={settings.secondReminderTime} onChange={(e) => update({ secondReminderTime: e.target.value })} /></Field>}
        </>
      )}
      <Button variant="secondary" onClick={test}>Test-Benachrichtigung</Button>
    </Card>
  );
}
