const tmdbService = require('../services/tmdb.service');
const { success, paginated } = require('../utils/response.utils');

const prisma = require('../config/prisma');

// ---------------------------------------------------------------------------
// Helper: given an array of TMDB movie objects, batch-query Prisma once and
// attach `isImported` + `hasActiveShows` to every item.
// ---------------------------------------------------------------------------
const enrichWithLocalData = async (tmdbMovies) => {
  if (!tmdbMovies || tmdbMovies.length === 0) return tmdbMovies;

  const tmdbIds = tmdbMovies.map(m => m.id).filter(Boolean);
  const now = new Date();

  try {
    // Single query — find all matching local movies and count their future shows
    const localMovies = await prisma.movie.findMany({
      where: { tmdbId: { in: tmdbIds } },
      select: {
        tmdbId: true,
        _count: {
          select: {
            shows: { where: { showTime: { gte: now } } },
          },
        },
      },
    });

    // Build a fast lookup map: tmdbId -> { isImported, hasActiveShows }
    const localMap = new Map();
    for (const lm of localMovies) {
      localMap.set(lm.tmdbId, {
        isImported: true,
        hasActiveShows: lm._count.shows > 0,
      });
    }

    return tmdbMovies.map(m => ({
      ...m,
      isImported: localMap.get(m.id)?.isImported ?? false,
      hasActiveShows: localMap.get(m.id)?.hasActiveShows ?? false,
    }));
  } catch {
    // DB unavailable — return movies without enrichment (graceful degradation)
    return tmdbMovies.map(m => ({ ...m, isImported: false, hasActiveShows: false }));
  }
};

// ---------------------------------------------------------------------------
// Local DB movies (already-imported, used for "Now Showing" section)
// ---------------------------------------------------------------------------
const getMovies = async (req, res, next) => {
  try {
    const now = new Date();
    const movies = await prisma.movie.findMany({
      where: { shows: { some: { showTime: { gte: now } } } },
      select: {
        id: true,
        tmdbId: true,
        title: true,
        originalTitle: true,
        posterPath: true,
        backdropPath: true,
        releaseDate: true,
        voteAverage: true,
      },
    });

    const formattedMovies = movies.map(m => ({
      id: m.tmdbId || m.id,
      title: m.title,
      original_title: m.originalTitle,
      poster_path: m.posterPath,
      backdrop_path: m.backdropPath,
      release_date: m.releaseDate,
      vote_average: m.voteAverage,
      isLocal: true,
      isImported: true,
      hasActiveShows: true, // these movies already filtered to have future shows
    }));

    res.json({ success: true, results: formattedMovies, total: formattedMovies.length, page: 1, limit: 20 });
  } catch (err) {
    console.warn('⚠️ Failed to fetch local movies:', err.message);
    res.json({ success: true, results: [], total: 0, page: 1, limit: 20 });
  }
};

// ---------------------------------------------------------------------------
// TMDB endpoints — enriched with local DB context
// ---------------------------------------------------------------------------
const getTopRated = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const result = await tmdbService.getTopRated({ page });
    result.results = await enrichWithLocalData(result.results);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getPopular = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const result = await tmdbService.getPopular({ page });
    result.results = await enrichWithLocalData(result.results);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getUpcoming = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const result = await tmdbService.getUpcoming({ page });
    result.results = await enrichWithLocalData(result.results);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getNowPlaying = async (req, res, next) => {
  try {
    const { page = 1 } = req.query;
    const result = await tmdbService.getNowPlaying({ page });
    result.results = await enrichWithLocalData(result.results);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getMovieById = async (req, res, next) => {
  try {
    const movie = await tmdbService.getMovieById(req.params.id);
    success(res, movie);
  } catch (err) { next(err); }
};

const getMovieCast = async (req, res, next) => {
  try {
    const cast = await tmdbService.getMovieCast(req.params.id);
    res.json({ success: true, cast });
  } catch (err) { next(err); }
};

const getSimilarMovies = async (req, res, next) => {
  try {
    const result = await tmdbService.getSimilarMovies(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const getRecommendedMovies = async (req, res, next) => {
  try {
    const result = await tmdbService.getRecommendedMovies(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

const searchMovies = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    const result = await tmdbService.searchMovies(q || '', { page });
    // Enrich search results too so admin can see which are already imported
    result.results = await enrichWithLocalData(result.results);
    paginated(res, result.results, page, result.limit, result.total);
  } catch (err) { next(err); }
};

const createMovie = async (req, res, next) => {
  res.status(405).json({ success: false, message: 'Create movie not supported via TMDB' });
};

module.exports = {
  getMovies, getTopRated, getPopular, getUpcoming, getNowPlaying, getMovieById,
  getMovieCast, getSimilarMovies, getRecommendedMovies, searchMovies, createMovie,
};
