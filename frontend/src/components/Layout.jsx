import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageCheck,
  ShoppingCart,
  X,
} from 'lucide-react';
import { useBakery } from '../contexts/BakeryContext';

const allNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF'] },
  { to: '/operations', label: 'Operations', icon: ShoppingCart, roles: ['ADMIN', 'STAFF'] },
  { to: '/inventory', label: 'Inventory', icon: PackageCheck, roles: ['ADMIN', 'STAFF'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['ADMIN'] },
  { to: '/history', label: 'History', icon: CalendarDays, roles: ['ADMIN'] },
  { to: '/waste', label: 'Waste', icon: AlertTriangle, roles: ['ADMIN'] },
];

function Layout() {
  const { user, logout } = useBakery();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = allNavItems.filter((item) =>
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="app-layout">
      {/* Mobile Top Header (< 768px) */}
      <header className="mobile-header">
        <button
          type="button"
          className="mobile-menu-btn"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="mobile-header-brand">
          <div className="brand-icon small">
            <ChefHat size={18} />
          </div>
          <span className="mobile-header-title">Smart Bakery</span>
        </div>

        <span className="mobile-header-badge">
          {user?.role === 'ADMIN' ? 'Admin' : 'Staff'}
        </span>
      </header>

      {/* Mobile Backdrop Overlay */}
      <div
        className={`sidebar-backdrop ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar (Desktop fixed, Mobile drawer) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="brand-block">
          <div className="brand-icon">
            <ChefHat size={22} />
          </div>
          <div className="brand-text">
            <h2>Smart Bakery</h2>
            <small>{user?.role === 'ADMIN' ? 'Admin Control' : 'Staff Portal'}</small>
          </div>
          {/* Close button inside drawer for mobile */}
          <button
            type="button"
            className="mobile-drawer-close"
            aria-label="Close menu"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav-list">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user-pill">
            <span className="sidebar-username">
              <strong style={{ color: 'var(--text)' }}>{user?.username}</strong>
            </span>
            <span
              className="sidebar-role-badge"
              style={{
                background: user?.role === 'ADMIN' ? 'var(--primary)' : 'var(--yellow)',
                color: user?.role === 'ADMIN' ? '#fff' : '#171412',
              }}
            >
              {user?.role}
            </span>
          </div>

          <button className="logout-button" type="button" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
