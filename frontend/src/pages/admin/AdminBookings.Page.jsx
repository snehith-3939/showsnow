import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../services/admin.service';

const STATUS_OPTIONS = ['', 'CONFIRMED', 'PENDING', 'CANCELLED', 'FAILED'];
const STATUS_COLORS = {
  CONFIRMED: 'bg-green-900/50 text-green-400 border-green-800',
  PENDING:   'bg-yellow-900/50 text-yellow-400 border-yellow-800',
  CANCELLED: 'bg-red-900/50 text-red-400 border-red-800',
  FAILED:    'bg-gray-800 text-gray-400 border-gray-700',
};

const LIMIT = 15;

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await adminService.getBookings(params);
      setBookings(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">All Bookings</h1>
        <p className="text-gray-400 mt-1 text-sm">View and filter every ticket booking on the platform.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-gray-400 text-sm font-medium">Filter by status:</span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s || 'all'}
            id={`filter-${s || 'all'}`}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-4 py-1.5 rounded-full border font-semibold transition ${
              statusFilter === s
                ? 'bg-red-600 text-white border-red-500'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
        <span className="ml-auto text-gray-500 text-xs">
          {total} total booking{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Booking ID', 'User', 'Movie', 'Theatre', 'Seats', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 bg-gray-800 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : bookings.length === 0
                ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                      No bookings found{statusFilter ? ` with status "${statusFilter}"` : ''}.
                    </td>
                  </tr>
                )
                : bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs">{b.id.slice(0, 8)}…</td>
                    <td className="px-5 py-4">
                      <p className="text-white font-medium text-xs">{b.user?.name || '—'}</p>
                      <p className="text-gray-500 text-xs">{b.user?.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-300 text-xs max-w-[120px] truncate">{b.show?.movie?.title}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{b.show?.screen?.theatre?.name}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{b.seats?.length ?? 0}</td>
                    <td className="px-5 py-4 text-white font-semibold text-xs">₹{b.totalAmount}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full border font-semibold whitespace-nowrap ${STATUS_COLORS[b.status] || STATUS_COLORS.FAILED}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-gray-500 text-xs">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                id="bookings-prev-btn"
                disabled={page === 1 || loading}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs border border-gray-700 hover:border-gray-500 disabled:opacity-40 transition"
              >
                ← Prev
              </button>
              <button
                id="bookings-next-btn"
                disabled={page === totalPages || loading}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-1.5 rounded-lg bg-gray-800 text-gray-300 text-xs border border-gray-700 hover:border-gray-500 disabled:opacity-40 transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
