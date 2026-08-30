import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { SignIn } from './pages/SignIn';
import { LandingPage } from './pages/LandingPage';
import { AlertsPage } from './pages/AlertsPage';
import { NodesPage } from './pages/NodesPage';
import { NodeDetailsPage } from './pages/NodeDetailsPage';
import { TrendPage } from './pages/TrendPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccessRestrictedPage } from './pages/AccessRestrictedPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isMineController } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  // Strictly enforce role-based access for Local Gateway Dashboard
  if (!isMineController) {
    return <Navigate to="/access-restricted" replace />;
  }

  return <Outlet />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/welcome" element={<LandingPage />} />
      <Route path="/login" element={<SignIn />} />
      <Route path="/access-restricted" element={<AccessRestrictedPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="nodes" element={<NodesPage />} />
          <Route path="nodes/:id" element={<NodeDetailsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="trend" element={<TrendPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<PlaceholderPage title="User Profile" />} />
        </Route>
      </Route>

      {/* Fallback to root or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

