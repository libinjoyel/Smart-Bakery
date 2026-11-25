import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BakeryProvider, useBakery } from './contexts/BakeryContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OperationsPage from './pages/OperationsPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WasteReportsPage from './pages/WasteReportsPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useBakery();

  if (loading) {
    return (
      <div className="page-shell" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <h2>Loading Smart Bakery...</h2>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/operations" element={<OperationsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/waste"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <WasteReportsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BakeryProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </BakeryProvider>
  );
}

export default App;
