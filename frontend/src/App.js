import { Routes, Route } from "react-router-dom";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import HomePage from "./pages/Home.Page";
import MoviePage from "./pages/Movie.Page";
import PlayPage from "./pages/Play.Page";
import BookingPage from "./pages/Booking.Page";
import PaymentPage from "./pages/Payment.Page";
import BookingDetailPage from "./pages/BookingDetail.Page";
import BookingHistoryPage from "./pages/BookingHistory.Page";
import ErrorPage from "./pages/404";
import NotificationsPage from "./pages/Notifications.Page";
import SettingsPage from "./pages/Settings.Page";
import ComingSoonPage from "./pages/ComingSoon.Page";

// Admin
import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./layout/Admin.layout";
import AdminDashboardPage from "./pages/admin/AdminDashboard.Page";
import AdminMoviesPage from "./pages/admin/AdminMovies.Page";
import AdminTheatresPage from "./pages/admin/AdminTheatres.Page";
import AdminShowsPage from "./pages/admin/AdminShows.Page";
import AdminBookingsPage from "./pages/admin/AdminBookings.Page";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:id" element={<MoviePage />} />
      <Route path="/plays" element={<PlayPage />} />
      <Route path="/show/:showId/book" element={<BookingPage />} />
      <Route path="/payment" element={<PaymentPage />} />
      <Route path="/bookings" element={<BookingHistoryPage />} />
      <Route path="/bookings/:id" element={<BookingDetailPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/coming-soon" element={<ComingSoonPage />} />

      {/* Admin routes — protected by AdminRoute guard */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="theatres" element={<AdminTheatresPage />} />
          <Route path="shows" element={<AdminShowsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

export default App;

