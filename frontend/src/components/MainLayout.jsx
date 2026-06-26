import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Mini CRM</div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/leads" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>Leads</span>
          </NavLink>
          <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>Analytics</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span>Settings</span>
          </NavLink>
        </nav>
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <h2>Welcome back</h2>
            <p>{user?.email}</p>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
