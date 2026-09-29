import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { TabBar } from '@/components';
import { useAppStore } from '@/store/useAppStore';
import { SetupWizard } from '@/features/setup/SetupWizard';
import { HomeScreen } from '@/features/home/HomeScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { MilestonesScreen } from '@/features/milestones/MilestonesScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';

function SetupGuard() {
  const setupDone = useAppStore((s) => s.setupDone);
  const location = useLocation();
  if (!setupDone) return <Navigate to="/setup" replace state={{ from: location }} />;
  return (
    <>
      <Outlet />
      <TabBar />
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/setup" element={<SetupWizard />} />
      <Route element={<SetupGuard />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/milestones" element={<MilestonesScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
