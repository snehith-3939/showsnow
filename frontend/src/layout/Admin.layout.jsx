import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/Auth.context';

const NAV_ITEMS = [
  { to: '/admin',           label: 'Overview',          icon: '📊', end: true },
  { to: '/admin/movies',    label: 'Movies',             icon: '🎬' },
  { to: '/admin/theatres',  label: 'Theatres & Screens', icon: '🏛️' },
  { to: '/admin/shows',     label: 'Show Scheduling',    icon: '🗓️' },
  { to: '/admin/bookings',  label: 'Bookings',           icon: '🎟️' },
];

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col min-h-screen fixed left-0 top-0 bottom-0 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-orange-400">
            ShowsNow Admin
          </h2>
          {user && (
            <p className="text-xs text-gray-500 mt-1 truncate">{user.email}</p>
          )}
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

