import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as adminService from '../../services/admin.service';

const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

const AdminMovies = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [localMovies, setLocalMovies] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [importing, setImporting] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const debounceRef = useRef(null);

  const fetchLocal = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await adminService.getMovies();
      setLocalMovies(res.data || []);
    } catch { setLocalMovies([]); }
    finally { setLocalLoading(false); }
  }, []);

  useEffect(() => { fetchLocal(); }, [fetchLocal]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await adminService.searchTmdbMovies(query);
        setSearchResults(res.data || []);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleImport = async (movie) => {
    setImporting(movie.id);
    try {
      await adminService.addMovieFromTmdb(movie.id);
      showFeedback('success', `"${movie.title}" imported!`);
      await fetchLocal();
      setSearchResults(prev => prev.map(m => m.id === movie.id ? { ...m, isImported: true } : m));
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Import failed');
    } finally { setImporting(null); }
  };

  const handleDelete = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}"? This removes all associated shows.`)) return;
    setDeleting(movie.id);
    try {
      await adminService.deleteMovie(movie.id);
      showFeedback('success', `"${movie.title}" deleted.`);
      await fetchLocal();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(null); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Movie Management</h1>
        <p className="text-gray-400 mt-1 text-sm">Search TMDB to import movies or manage existing ones.</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.msg}
        </div>
      )}

      {/* TMDB Search */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">🔍 Search & Import from TMDB</h2>
        <input
          id="tmdb-search-input"
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title (e.g. Dune, Inception)..."
          className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
        />
        {searching && <p className="text-gray-400 text-sm animate-pulse">Searching TMDB...</p>}
        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {searchResults.map(movie => (
              <div key={movie.id} className="flex items-center gap-4 bg-gray-800 rounded-xl p-3 border border-gray-700 hover:border-gray-600 transition-all">
                <img
                  src={movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : ''}
                  alt={movie.title}
                  className="w-10 h-14 object-cover rounded flex-shrink-0 bg-gray-700"
                  onError={e => { e.target.style.opacity = 0.3; }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{movie.title}</p>
                  <p className="text-gray-500 text-xs">{movie.release_date?.split('-')[0]} · ⭐ {movie.vote_average?.toFixed(1)}</p>
                </div>
                {movie.isImported ? (
                  <span className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-gray-700 text-gray-400 border border-gray-600 font-semibold">✓ Imported</span>
                ) : (
                  <button
                    id={`import-btn-${movie.id}`}
                    onClick={() => handleImport(movie)}
                    disabled={importing === movie.id}
                    className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold transition disabled:opacity-50"
                  >
                    {importing === movie.id ? 'Importing…' : '+ Import'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Movies Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">🗃️ Local Database ({localMovies.length})</h2>
          <button onClick={fetchLocal} className="text-gray-400 hover:text-white text-sm transition">↻ Refresh</button>
        </div>
        {localLoading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>
        ) : localMovies.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No movies imported yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['', 'Title', 'Release', 'Rating', 'TMDB ID', ''].map((h, i) => (
                    <th key={i} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {localMovies.map(movie => (
                  <tr key={movie.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="px-6 py-3">
                      <img src={movie.posterPath ? `${TMDB_IMG}${movie.posterPath}` : ''} alt={movie.title} className="w-8 h-12 object-cover rounded bg-gray-700" />
                    </td>
                    <td className="px-6 py-3 text-white font-medium max-w-xs truncate">{movie.title}</td>
                    <td className="px-6 py-3 text-gray-400">{movie.releaseDate?.split('T')[0] || '—'}</td>
                    <td className="px-6 py-3 text-yellow-400 font-semibold">⭐ {movie.voteAverage?.toFixed(1)}</td>
                    <td className="px-6 py-3 text-gray-500 font-mono text-xs">{movie.tmdbId || '—'}</td>
                    <td className="px-6 py-3">
                      <button
                        id={`delete-movie-${movie.id}`}
                        onClick={() => handleDelete(movie)}
                        disabled={deleting === movie.id}
                        className="text-xs px-3 py-1 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-800/60 border border-red-800/50 transition disabled:opacity-50"
                      >
                        {deleting === movie.id ? 'Deleting…' : '🗑 Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMovies;
