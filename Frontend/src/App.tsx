import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SignIn } from './pages/SignIn';
import { AIInteraction } from './pages/AIInteraction';
import { LiveMapPage } from './pages/LiveMapPage';
import { LandingPage } from './pages/LandingPage';
import { RiskZonesPage } from './pages/RiskZonesPage';
import { AlertsPage } from './pages/AlertsPage';
import { NodesPage } from './pages/NodesPage';

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  return isAuthenticated ? <Outlet /> : <Navigate to="/welcome" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/welcome" element={<LandingPage />} />
        <Route path="/login" element={<SignIn />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="live-map" element={<LiveMapPage />} />
            <Route path="map" element={<Navigate to="/live-map" replace />} />
            <Route path="nodes" element={<NodesPage />} />
            <Route path="deformation" element={<PlaceholderPage title="Deformation" />} />
            <Route path="risk-zones" element={<RiskZonesPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="analytics" element={<PlaceholderPage title="Analytics" />} />
            <Route path="ai-interaction" element={<AIInteraction />} />
            <Route path="maintenance" element={<PlaceholderPage title="Maintenance" />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" />} />
            <Route path="profile" element={<PlaceholderPage title="User Profile" />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
