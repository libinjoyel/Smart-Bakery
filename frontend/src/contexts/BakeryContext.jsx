import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const BakeryContext = createContext(null);

const bakeryApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export function BakeryProvider({ children }) {
  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [historyReport, setHistoryReport] = useState({ monthSummary: { totalRevenue: 0, totalProductsSold: 0 }, dailyHistory: [] });
  const [wasteReport, setWasteReport] = useState({ success: true, data: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [summaryRes, productsRes, inventoryRes, ledgerRes, historyRes, wasteRes] = await Promise.all([
        bakeryApi.get('/dashboard/summary'),
        bakeryApi.get('/inventory/products'),
        bakeryApi.get('/inventory'),
        bakeryApi.get('/analytics/ledger'),
        bakeryApi.get('/analytics/history'),
        bakeryApi.get('/analytics/waste'),
      ]);

      setSummary(summaryRes.data);
      setProducts(productsRes.data);
      setInventory(inventoryRes.data);
      setLedger(ledgerRes.data);
      setHistoryReport(historyRes.data);
      setWasteReport(wasteRes.data);
    } catch (error) {
      console.error('Bakery data fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addInventoryBatch = async (payload) => {
    const response = await bakeryApi.post('/inventory/checkin', payload);
    void fetchData().catch(() => {});
    return response.data;
  };

  const createProduct = async (payload) => {
    const response = await bakeryApi.post('/inventory/products', payload);
    void fetchData().catch(() => {});
    return response.data.data;
  };

  const updateProduct = async (productId, payload) => {
    const response = await bakeryApi.put(`/inventory/products/${productId}`, payload);
    void fetchData().catch(() => {});
    return response.data.data;
  };

  const deleteProduct = async (productId) => {
    const response = await bakeryApi.delete(`/inventory/products/${productId}`);
    void fetchData().catch(() => {});
    return response.data;
  };

  const sellProduct = async (productId, quantity = 1) => {
    const response = await bakeryApi.post('/inventory/sell', { productId, quantity });
    void fetchData().catch(() => {});
    return response.data;
  };

  const completeSale = async (items) => {
    const response = await bakeryApi.post('/inventory/sell', { items });
    void fetchData().catch(() => {});
    return response.data;
  };

  const value = useMemo(() => ({
    summary,
    products,
    inventory,
    ledger,
    historyReport,
    wasteReport,
    loading,
    refresh: fetchData,
    addInventoryBatch,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProduct,
    completeSale,
  }), [summary, products, inventory, ledger, historyReport, wasteReport, loading]);

  return <BakeryContext.Provider value={value}>{children}</BakeryContext.Provider>;
}

export function useBakery() {
  const context = useContext(BakeryContext);

  if (!context) {
    throw new Error('useBakery must be used within BakeryProvider');
  }

  return context;
}
