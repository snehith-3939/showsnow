import api from './api.service';

export const getStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data;
};

export const getMovies = async () => {
  const res = await api.get('/admin/movies');
  return res.data;
};

export const addMovieFromTmdb = async (tmdbId) => {
  const res = await api.post('/admin/movies/tmdb', { tmdbId });
  return res.data;
};

export const deleteMovie = async (id) => {
  const res = await api.delete(`/admin/movies/${id}`);
  return res.data;
};

export const getShows = async () => {
  const res = await api.get('/admin/shows');
  return res.data;
};

export const createShow = async (data) => {
  const res = await api.post('/admin/shows', data);
  return res.data;
};

export const getTheatres = async () => {
  const res = await api.get('/admin/theatres');
  return res.data;
};

export const createTheatre = async (data) => {
  const res = await api.post('/admin/theatres', data);
  return res.data;
};

export const createScreen = async (data) => {
  const res = await api.post('/admin/screens', data);
  return res.data;
};

export const getBookings = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const res = await api.get(`/admin/bookings${query ? `?${query}` : ''}`);
  return res.data;
};

// Reuse regular search endpoint — enriched by backend with isImported flag
export const searchTmdbMovies = async (query) => {
  const res = await api.get(`/movies/search?q=${encodeURIComponent(query)}`);
  return res.data;
};

