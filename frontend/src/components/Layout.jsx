import { NavLink, Outlet } from 'react-router-dom';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChefHat,
  LayoutDashboard,
  LogOut,
  PackageCheck,
  ShoppingCart,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/operations', label: 'Operations', icon: ShoppingCart },
  { to: '/inventory', label: 'Inventory', icon: PackageCheck },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/history', label: 'History', icon: CalendarDays },
  { to: '/waste', label: 'Waste', icon: AlertTriangle },
];

function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-icon"><ChefHat size={22} /></div>
          <div>
            <h2>Smart Bakery</h2>
            <small>Control Center</small>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="logout-button" type="button">
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <main className="content-panel">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
