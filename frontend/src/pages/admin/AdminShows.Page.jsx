import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../services/admin.service';

const AdminShows = () => {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [form, setForm] = useState({
    movieId: '',
    theatreId: '',
    screenId: '',
    showTime: '',
    basePrice: '',
  });

  // Derived: screens for the chosen theatre
  const availableScreens = theatres.find(t => t.id === Number(form.theatreId))?.screens || [];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [moviesRes, theatresRes, showsRes] = await Promise.all([
        adminService.getMovies(),
        adminService.getTheatres(),
        adminService.getShows(),
      ]);
      setMovies(moviesRes.data || []);
      setTheatres(theatresRes.data || []);
      setShows(showsRes.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.movieId || !form.screenId || !form.showTime || !form.basePrice) {
      showFeedback('error', 'Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      await adminService.createShow({
        movieId: Number(form.movieId),
        screenId: Number(form.screenId),
        showTime: new Date(form.showTime).toISOString(),
        basePrice: Number(form.basePrice),
      });
      showFeedback('success', 'Show scheduled successfully!');
      setForm({ movieId: '', theatreId: '', screenId: '', showTime: '', basePrice: '' });
      await fetchAll();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create show');
    } finally { setSubmitting(false); }
  };

  const formatShowTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const upcomingShows = shows.filter(s => new Date(s.showTime) >= new Date());
  const pastShows = shows.filter(s => new Date(s.showTime) < new Date());

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Show Scheduling</h1>
        <p className="text-gray-400 mt-1 text-sm">Pair a movie with a screen and schedule it for booking.</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.msg}
        </div>
      )}

      {/* Schedule Form */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-5">🗓️ Schedule a New Show</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Movie */}
          <div>
            <label htmlFor="show-movie" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Movie</label>
            <select
              id="show-movie"
              required
              value={form.movieId}
              onChange={e => setForm(f => ({ ...f, movieId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">-- Select a movie --</option>
              {movies.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Theatre */}
          <div>
            <label htmlFor="show-theatre" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Theatre</label>
            <select
              id="show-theatre"
              required
              value={form.theatreId}
              onChange={e => setForm(f => ({ ...f, theatreId: e.target.value, screenId: '' }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="">-- Select a theatre --</option>
              {theatres.map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.city}</option>
              ))}
            </select>
          </div>

          {/* Screen (filtered by theatre) */}
          <div>
            <label htmlFor="show-screen" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Screen</label>
            <select
              id="show-screen"
              required
              disabled={!form.theatreId}
              value={form.screenId}
              onChange={e => setForm(f => ({ ...f, screenId: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm disabled:opacity-40"
            >
              <option value="">{form.theatreId ? '-- Select a screen --' : 'Select a theatre first'}</option>
              {availableScreens.map(s => (
                <option key={s.id} value={s.id}>{s.name} · {s.totalSeats} seats</option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label htmlFor="show-time" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Show Date & Time</label>
            <input
              id="show-time"
              type="datetime-local"
              required
              value={form.showTime}
              min={new Date().toISOString().slice(0, 16)}
              onChange={e => setForm(f => ({ ...f, showTime: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          {/* Base Price */}
          <div>
            <label htmlFor="show-price" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Base Price (₹)</label>
            <input
              id="show-price"
              type="number"
              required
              min={50}
              max={2000}
              value={form.basePrice}
              onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))}
              placeholder="e.g. 250"
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <button
              id="create-show-btn"
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Scheduling…' : '+ Schedule Show'}
            </button>
          </div>
        </form>
      </div>

      {/* Shows Table */}
      {loading ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center text-gray-500 animate-pulse">Loading shows...</div>
      ) : (
        <>
          <ShowsTable title={`🟢 Upcoming Shows (${upcomingShows.length})`} shows={upcomingShows} formatShowTime={formatShowTime} />
          {pastShows.length > 0 && (
            <ShowsTable title={`⏮ Past Shows (${pastShows.length})`} shows={pastShows} formatShowTime={formatShowTime} faded />
          )}
        </>
      )}
    </div>
  );
};

const ShowsTable = ({ title, shows, formatShowTime, faded = false }) => (
  <div className={`bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden ${faded ? 'opacity-60' : ''}`}>
    <div className="px-6 py-4 border-b border-gray-800">
      <h2 className="text-lg font-bold text-white">{title}</h2>
    </div>
    {shows.length === 0 ? (
      <div className="p-8 text-center text-gray-500">No shows.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {['Movie', 'Theatre', 'Screen', 'Date & Time', 'Base Price', 'Seats', 'Booked'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {shows.map(show => (
              <tr key={show.id} className="hover:bg-gray-800/40 transition-colors">
                <td className="px-6 py-4 text-white font-medium">{show.movie?.title}</td>
                <td className="px-6 py-4 text-gray-400">{show.screen?.theatre?.name}</td>
                <td className="px-6 py-4 text-gray-400">{show.screen?.name}</td>
                <td className="px-6 py-4 text-gray-300 font-mono text-xs">{formatShowTime(show.showTime)}</td>
                <td className="px-6 py-4 text-white font-semibold">₹{show.basePrice}</td>
                <td className="px-6 py-4 text-gray-400">{show.totalSeats}</td>
                <td className="px-6 py-4">
                  <span className={`font-semibold ${show.bookedSeats === show.totalSeats ? 'text-red-400' : 'text-green-400'}`}>
                    {show.bookedSeats}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default AdminShows;
