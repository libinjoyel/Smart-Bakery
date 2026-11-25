import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const BakeryContext = createContext(null);

const bakeryApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Attach Authorization Bearer token to all outgoing requests if token exists
bakeryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart_bakery_token');
  if (token && token !== 'null' && token !== 'undefined') {
    if (config.headers?.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function BakeryProvider({ children }) {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('smart_bakery_token');
    return saved && saved !== 'null' && saved !== 'undefined' ? saved : null;
  });
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('smart_bakery_user');
      return savedUser && savedUser !== 'null' && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [summary, setSummary] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [historyReport, setHistoryReport] = useState({ monthSummary: { totalRevenue: 0, totalProductsSold: 0 }, dailyHistory: [] });
  const [wasteReport, setWasteReport] = useState({ success: true, data: [] });
  const [loading, setLoading] = useState(Boolean(token && user));
  const [apiError, setApiError] = useState(null);

  const logout = () => {
    localStorage.removeItem('smart_bakery_token');
    localStorage.removeItem('smart_bakery_user');
    setToken(null);
    setUser(null);
    setSummary(null);
    setInventory([]);
    setProducts([]);
    setLedger([]);
    setHistoryReport({ monthSummary: { totalRevenue: 0, totalProductsSold: 0 }, dailyHistory: [] });
    setWasteReport({ success: true, data: [] });
    setApiError(null);
    setLoading(false);
  };

  // Intercept 401 responses to auto-clear session
  useEffect(() => {
    const responseInterceptor = bakeryApi.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      bakeryApi.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchData = async (currentUser = user, currentToken = token) => {
    if (!currentToken || !currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setApiError(null);

      if (currentUser.role === 'ADMIN') {
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
      } else {
        // STAFF role: fetch operational endpoints only (do NOT call admin-only analytics routes)
        const [summaryRes, productsRes, inventoryRes] = await Promise.all([
          bakeryApi.get('/dashboard/summary'),
          bakeryApi.get('/inventory/products'),
          bakeryApi.get('/inventory'),
        ]);

        setSummary(summaryRes.data);
        setProducts(productsRes.data);
        setInventory(inventoryRes.data);
        setLedger([]);
        setHistoryReport({ monthSummary: { totalRevenue: 0, totalProductsSold: 0 }, dailyHistory: [] });
        setWasteReport({ success: true, data: [] });
      }
    } catch (error) {
      console.error('Bakery data fetch failed:', error);
      const errorMsg = error.response?.data?.message
        || (error.code === 'ECONNABORTED' ? 'Request timed out. Please check your network or server connection.' : '')
        || (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') ? 'Cannot connect to backend server. Make sure the API server is running.' : error.message);
      setApiError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) {
      fetchData(user, token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const response = await bakeryApi.post('/auth/login', { username, password });
    if (response.data.success && response.data.token) {
      const authToken = response.data.token;
      const authUser = response.data.user;

      localStorage.setItem('smart_bakery_token', authToken);
      localStorage.setItem('smart_bakery_user', JSON.stringify(authUser));

      setToken(authToken);
      setUser(authUser);

      await fetchData(authUser, authToken);
      return authUser;
    }
    throw new Error(response.data?.message || 'Invalid username or password.');
  };

  const addInventoryBatch = async (payload) => {
    const response = await bakeryApi.post('/inventory/checkin', payload);
    void fetchData(user, token).catch(() => {});
    return response.data;
  };

  const createProduct = async (payload) => {
    const response = await bakeryApi.post('/inventory/products', payload);
    void fetchData(user, token).catch(() => {});
    return response.data.data;
  };

  const updateProduct = async (productId, payload) => {
    const response = await bakeryApi.put(`/inventory/products/${productId}`, payload);
    void fetchData(user, token).catch(() => {});
    return response.data.data;
  };

  const deleteProduct = async (productId) => {
    const response = await bakeryApi.delete(`/inventory/products/${productId}`);
    void fetchData(user, token).catch(() => {});
    return response.data;
  };

  const sellProduct = async (productId, quantity = 1) => {
    const response = await bakeryApi.post('/inventory/sell', { productId, quantity });
    void fetchData(user, token).catch(() => {});
    return response.data;
  };

  const completeSale = async (items) => {
    const response = await bakeryApi.post('/inventory/sell', { items });
    void fetchData(user, token).catch(() => {});
    return response.data;
  };

  const value = useMemo(() => ({
    token,
    user,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    summary,
    products,
    inventory,
    ledger,
    historyReport,
    wasteReport,
    loading,
    apiError,
    refresh: () => fetchData(user, token),
    addInventoryBatch,
    createProduct,
    updateProduct,
    deleteProduct,
    sellProduct,
    completeSale,
  }), [token, user, summary, products, inventory, ledger, historyReport, wasteReport, loading, apiError]);

  return <BakeryContext.Provider value={value}>{children}</BakeryContext.Provider>;
}

export function useBakery() {
  const context = useContext(BakeryContext);

  if (!context) {
    throw new Error('useBakery must be used within BakeryProvider');
  }

  return context;
}
