import React, { useState, useEffect, useCallback } from 'react';
import * as adminService from '../../services/admin.service';

const SEAT_TYPE_OPTIONS = ['STANDARD', 'PREMIUM', 'VIP'];
const ROW_PRESETS = ['A','B','C','D','E','F','G','H','I','J'];

const InputField = ({ label, id, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
    <input
      id={id}
      {...props}
      className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
    />
  </div>
);

const AdminTheatres = () => {
  const [theatres, setTheatres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Theatre form
  const [tForm, setTForm] = useState({ name: '', address: '', city: '', state: '', pincode: '' });
  const [tSubmitting, setTSubmitting] = useState(false);

  // Screen form
  const [sForm, setSForm] = useState({ theatreId: '', name: '', totalSeats: '', rows: 8, seatsPerRow: 10, seatType: 'STANDARD' });
  const [sSubmitting, setSSubmitting] = useState(false);

  const fetchTheatres = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getTheatres();
      setTheatres(res.data || []);
    } catch { setTheatres([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTheatres(); }, [fetchTheatres]);

  const showFeedback = (type, msg) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleTheatreSubmit = async (e) => {
    e.preventDefault();
    setTSubmitting(true);
    try {
      await adminService.createTheatre(tForm);
      showFeedback('success', `Theatre "${tForm.name}" created!`);
      setTForm({ name: '', address: '', city: '', state: '', pincode: '' });
      await fetchTheatres();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create theatre');
    } finally { setTSubmitting(false); }
  };

  const handleScreenSubmit = async (e) => {
    e.preventDefault();
    const rowLabels = ROW_PRESETS.slice(0, Number(sForm.rows));
    const seatTypes = {};
    rowLabels.forEach(r => { seatTypes[r] = sForm.seatType; });
    const payload = {
      theatreId: Number(sForm.theatreId),
      name: sForm.name,
      totalSeats: Number(sForm.rows) * Number(sForm.seatsPerRow),
      rows: rowLabels,
      seatsPerRow: Number(sForm.seatsPerRow),
      seatTypes,
    };
    setSSubmitting(true);
    try {
      await adminService.createScreen(payload);
      showFeedback('success', `Screen "${sForm.name}" created with ${payload.totalSeats} seats!`);
      setSForm(prev => ({ ...prev, name: '', totalSeats: '' }));
      await fetchTheatres();
    } catch (err) {
      showFeedback('error', err.response?.data?.message || 'Failed to create screen');
    } finally { setSSubmitting(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Theatres & Screens</h1>
        <p className="text-gray-400 mt-1 text-sm">Create theatres and configure their screens with auto-generated seats.</p>
      </div>

      {feedback && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          feedback.type === 'success' ? 'bg-green-900/40 border-green-700 text-green-300' : 'bg-red-900/40 border-red-700 text-red-300'
        }`}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Theatre Form */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-5">🏛️ Add New Theatre</h2>
          <form onSubmit={handleTheatreSubmit} className="space-y-4">
            <InputField label="Theatre Name" id="theatre-name" required value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))} placeholder="PVR Phoenix" />
            <InputField label="Address" id="theatre-address" required value={tForm.address} onChange={e => setTForm(f => ({ ...f, address: e.target.value }))} placeholder="High Street Phoenix, Lower Parel" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="City" id="theatre-city" required value={tForm.city} onChange={e => setTForm(f => ({ ...f, city: e.target.value }))} placeholder="Mumbai" />
              <InputField label="State" id="theatre-state" required value={tForm.state} onChange={e => setTForm(f => ({ ...f, state: e.target.value }))} placeholder="Maharashtra" />
            </div>
            <InputField label="Pincode" id="theatre-pincode" required value={tForm.pincode} onChange={e => setTForm(f => ({ ...f, pincode: e.target.value }))} placeholder="400013" />
            <button
              id="create-theatre-btn"
              type="submit"
              disabled={tSubmitting}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {tSubmitting ? 'Creating…' : '+ Create Theatre'}
            </button>
          </form>
        </div>

        {/* Add Screen Form */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-5">🎭 Add Screen to Theatre</h2>
          <form onSubmit={handleScreenSubmit} className="space-y-4">
            <div>
              <label htmlFor="screen-theatre" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Select Theatre</label>
              <select
                id="screen-theatre"
                required
                value={sForm.theatreId}
                onChange={e => setSForm(f => ({ ...f, theatreId: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="">-- Select a theatre --</option>
                {theatres.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                ))}
              </select>
            </div>
            <InputField label="Screen Name" id="screen-name" required value={sForm.name} onChange={e => setSForm(f => ({ ...f, name: e.target.value }))} placeholder="Screen 1 / Audi 1" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Rows</label>
                <select
                  value={sForm.rows}
                  onChange={e => setSForm(f => ({ ...f, rows: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  {[4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} rows ({ROW_PRESETS.slice(0,n).join(',')})</option>)}
                </select>
              </div>
              <InputField label="Seats / Row" id="seats-per-row" type="number" min={5} max={30} required value={sForm.seatsPerRow} onChange={e => setSForm(f => ({ ...f, seatsPerRow: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Default Seat Type</label>
              <div className="flex gap-2">
                {SEAT_TYPE_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSForm(f => ({ ...f, seatType: t }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                      sForm.seatType === t ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-gray-500 text-xs mt-1">
                Total: {Number(sForm.rows) * Number(sForm.seatsPerRow)} seats · Price: {sForm.seatType === 'VIP' ? '₹450' : sForm.seatType === 'PREMIUM' ? '₹280' : '₹180'}/seat
              </p>
            </div>
            <button
              id="create-screen-btn"
              type="submit"
              disabled={sSubmitting || !sForm.theatreId}
              className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            >
              {sSubmitting ? 'Creating…' : '+ Create Screen & Seats'}
            </button>
          </form>
        </div>
      </div>

      {/* Theatres List */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">All Theatres ({theatres.length})</h2>
          <button onClick={fetchTheatres} className="text-gray-400 hover:text-white text-sm transition">↻ Refresh</button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Loading...</div>
        ) : theatres.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No theatres created yet.</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {theatres.map(theatre => (
              <div key={theatre.id} className="px-6 py-4 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{theatre.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{theatre.address}, {theatre.city} — {theatre.pincode}</p>
                  </div>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full border border-gray-700">
                    {theatre.screens?.length || 0} screen{theatre.screens?.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {theatre.screens?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {theatre.screens.map(s => (
                      <span key={s.id} className="text-xs bg-gray-800/80 text-gray-300 px-2 py-1 rounded-lg border border-gray-700">
                        {s.name} · {s.totalSeats} seats
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTheatres;
