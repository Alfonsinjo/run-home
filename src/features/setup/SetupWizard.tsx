import { Button, Screen } from '@/components';
import { useAppStore } from '@/store/useAppStore';
export function SetupWizard() {
  const completeSetup = useAppStore((s) => s.completeSetup);
  return <Screen title="Einrichtung"><Button onClick={completeSetup}>Weiter (Platzhalter)</Button></Screen>;
}
