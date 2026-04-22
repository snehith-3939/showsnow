import React, { useEffect, useState, useCallback } from 'react';
import * as adminService from '../../services/admin.service';

const STAT_CONFIG = [
  { key: 'totalUsers',    label: 'Total Users',    icon: '👥', color: 'from-blue-600 to-blue-400' },
  { key: 'totalMovies',   label: 'Movies in DB',   icon: '🎬', color: 'from-purple-600 to-purple-400' },
  { key: 'totalBookings', label: 'Tickets Sold',   icon: '🎟️', color: 'from-green-600 to-emerald-400' },
  { key: 'totalRevenue',  label: 'Revenue',         icon: '💰', color: 'from-red-600 to-orange-400', prefix: '₹' },
];

const STATUS_COLORS = {
  CONFIRMED: 'bg-green-900/50 text-green-400 border-green-800',
  PENDING:   'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  CANCELLED: 'bg-red-900/50 text-red-400 border-red-800',
  FAILED:    'bg-gray-800 text-gray-400 border-gray-700',
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setBookingsLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getBookings({ limit: 8, page: 1 }),
      ]);
      setStats(statsRes.data);
      setBookings(bookingsRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">Dashboard Overview</h1>
        <p className="text-gray-400 mt-1 text-sm">Platform health at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {STAT_CONFIG.map(({ key, label, icon, color, prefix }) => (
          <div
            key={key}
            className="bg-gray-900 rounded-2xl p-6 border border-gray-800 hover:border-gray-600 transition-all duration-200 hover:shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl">{icon}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${color} bg-opacity-20 text-white`}>
                LIVE
              </span>
            </div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">{label}</p>
            {loading ? (
              <div className="h-8 bg-gray-800 rounded animate-pulse w-3/4" />
            ) : (
              <p className={`text-3xl font-extrabold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                {prefix}{key === 'totalRevenue'
                  ? Number(stats?.[key] || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })
                  : (stats?.[key] ?? 0)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Recent Bookings</h2>
          <a href="/admin/bookings" className="text-red-400 hover:text-red-300 text-sm transition">
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['User', 'Movie', 'Theatre', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {bookingsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : bookings.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No bookings yet.</td>
                  </tr>
                )
                : bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-4 text-gray-300 font-medium">{b.user?.name || b.user?.email}</td>
                    <td className="px-6 py-4 text-gray-300">{b.show?.movie?.title}</td>
                    <td className="px-6 py-4 text-gray-400">{b.show?.screen?.theatre?.name}</td>
                    <td className="px-6 py-4 text-white font-semibold">₹{b.totalAmount}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${STATUS_COLORS[b.status] || STATUS_COLORS.FAILED}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

