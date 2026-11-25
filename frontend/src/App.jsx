import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { BakeryProvider } from './contexts/BakeryContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OperationsPage from './pages/OperationsPage';
import InventoryPage from './pages/InventoryPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WasteReportsPage from './pages/WasteReportsPage';
import HistoryPage from './pages/HistoryPage';
import './App.css';

function App() {
  return (
    <BakeryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/operations" element={<OperationsPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/waste" element={<WasteReportsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </BakeryProvider>
  );
}

export default App;
