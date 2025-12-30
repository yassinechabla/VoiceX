import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Layout.css';

function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1>Restaurant Admin</h1>
          <p className="user-info">{user?.username}</p>
        </div>
        <ul className="nav-menu">
          <li>
            <Link
              to="/"
              className={location.pathname === '/' ? 'active' : ''}
            >
              Reservations
            </Link>
          </li>
          <li>
            <Link
              to="/tables"
              className={location.pathname === '/tables' ? 'active' : ''}
            >
              Tables
            </Link>
          </li>
          <li>
            <Link
              to="/settings"
              className={location.pathname === '/settings' ? 'active' : ''}
            >
              Settings
            </Link>
          </li>
        </ul>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;

