import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CentralLayout } from './components/layout/CentralLayout';
import { SignIn } from './pages/SignIn';
import { LandingPage } from './pages/LandingPage';
import { AccessRestrictedPage } from './pages/AccessRestrictedPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MineProvider } from './context/MineContext';

// Central Dashboard Pages
import { CentralOverviewPage } from './pages/central/CentralOverviewPage';
import { MineDetailPage } from './pages/central/MineDetailPage';
import { PanelDetailPage } from './pages/central/PanelDetailPage';
import { CentralPanelsPage } from './pages/central/CentralPanelsPage';
import { CentralNodesPage } from './pages/central/CentralNodesPage';
import { CentralGatewaysPage } from './pages/central/CentralGatewaysPage';
import { CentralAlertsPage } from './pages/central/CentralAlertsPage';
import { SensorPlacementPage } from './pages/planning/SensorPlacementPage';
import { NodeRelocationPage } from './pages/planning/NodeRelocationPage';
import { CompliancePage } from './pages/central/CompliancePage';
import { CentralReportsPage } from './pages/central/CentralReportsPage';
import { GatewayRegistryPage } from './pages/admin/GatewayRegistryPage';
import { CentralSettingsPage } from './pages/central/CentralSettingsPage';

/**
 * Root redirect — points to Centralized Dashboard at /dashboard
 */
const RootRedirect = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/welcome" replace />;
  return <Navigate to="/dashboard" replace />;
};

// Route guard for Central Dashboard
const CentralProtectedRoute = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/access-restricted" element={<AccessRestrictedPage />} />

      {/* Centralized Mine Subsidence Dashboard Routes */}
      <Route element={<CentralProtectedRoute />}>
        <Route element={<CentralLayout />}>
          {/* Main Central Dashboard */}
          <Route path="/dashboard" element={<CentralOverviewPage />} />
          <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
          <Route path="/central" element={<Navigate to="/dashboard" replace />} />

          {/* Directory Views */}
          <Route path="/central/panels" element={<CentralPanelsPage />} />
          <Route path="/central/nodes" element={<CentralNodesPage />} />
          <Route path="/central/gateways" element={<CentralGatewaysPage />} />
          <Route path="/central/alerts" element={<CentralAlertsPage />} />

          {/* Mine Level & Panel Level Drilldown */}
          <Route path="/mine/:mineId" element={<MineDetailPage />} />
          <Route path="/mine/:mineId/panel/:panelId" element={<PanelDetailPage />} />
          <Route path="/mine/:mineId/panel/:panelId/:tab" element={<PanelDetailPage />} />

          {/* Planning Suite */}
          <Route path="/planning/placement" element={<SensorPlacementPage />} />
          <Route path="/planning/relocation" element={<NodeRelocationPage />} />

          {/* Compliance */}
          <Route path="/compliance" element={<CompliancePage />} />

          {/* Reports */}
          <Route path="/reports" element={<CentralReportsPage />} />

          {/* Admin & System */}
          <Route path="/admin/gateways" element={<GatewayRegistryPage />} />
          <Route path="/central/settings" element={<CentralSettingsPage />} />
        </Route>
      </Route>

      {/* Redirect all legacy /local paths directly to /dashboard */}
      <Route path="/local" element={<Navigate to="/dashboard" replace />} />
      <Route path="/local/*" element={<Navigate to="/dashboard" replace />} />

      {/* Root "/" — redirect to /dashboard */}
      <Route path="/" element={<RootRedirect />} />

      {/* Fallback for unmatched routes */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MineProvider>
          <AppRoutes />
        </MineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
