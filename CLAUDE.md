# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the **ShowsNow** repository.

## Project Overview

**ShowsNow** is a premium, full-stack movie ticket booking platform (BookMyShow clone) designed with a modern dark-mode aesthetic and robust transactional logic.

- **Stack**: React 18, Node.js + Express, PostgreSQL + Prisma, Tailwind CSS.
- **Core Strategy**: Modular MVC on the backend, Service-based architecture on the frontend.
- **Key Features**: TMDB Integration, Pessimistic Seat Locking, Payment Gateway integration (mockable), Waitlist system, Admin Management System.

---

## Commands

### Frontend (`cd frontend`)
```bash
npm start          # Dev server at http://localhost:3000
npm run build      # Production build
npm test           # Run tests
```

### Backend (`cd backend`)
```bash
npm run dev        # Dev server with nodemon at http://localhost:5000
npm start          # Production start
npm run prisma:push      # Push schema to DB (no migration history)
npm run prisma:migrate   # Create and apply migration
npm run prisma:generate  # Regenerate Prisma client after schema changes
npm run prisma:studio    # Open Prisma Studio GUI
npm run seed             # Seed with mock data (admin/user, movies, shows)
```

---

## Architecture & Flows

### Backend (`backend/src/`)

**Pattern**: `Routes -> Middleware -> Controllers -> Services -> Prisma -> DB`

- **Services**: All business logic resides here (e.g., `seat.service.js` handles locking, `booking.service.js` handles transactions).
- **Middleware**:
    - `auth.middleware.js`: JWT verification and `requireAdmin` role check.
    - `error.middleware.js`: Centralized error handling using `AppError` subclasses.
    - `validate.middleware.js`: Request body validation using `express-validator`.
- **Seat Locking**: Uses a `SeatLock` table.
    - Locking is pessimistic: `POST /api/shows/:id/lock` creates a reservation for 10 minutes.
    - Expired locks are auto-purged on each lock request.
- **Mock Payment**: If `RAZORPAY_KEY_ID` is missing, the system enters mock mode (auto-confirms orders).

### Frontend (`frontend/src/`)

- **State Management**:
    - `Auth.context.jsx`: Global user state, `login/logout`, and token persistence in `localStorage`.
    - `Movie.context.jsx`: Current movie state and payment modal control.
- **Service Layer**: `api.service.js` (Axios wrapper) + domain-specific services (`movie.service.js`, `admin.service.js`).
- **Layouts**:
    - `Default.layout`: Navbar + Footer.
    - `Movie.layout`: Specialized for movie detail views.
    - `Admin.layout`: Sidebar-based layout for the dashboard.
- **Booking Flow**: Movie Page → Show/Time Selection → Seat Selector (locks seats) → Payment Modal → Booking Success.

---

## Data Model (Summary)

- **User**: `id, email, passwordHash, role (USER/ADMIN)`
- **Movie**: `tmdbId` (unique), `title`, `overview`, `backdropPath`, `posterPath`, etc.
- **Theatre/Screen/Seat**: Hierarchical structure. `Seat` belongs to `Screen`.
- **Show**: Connects `Movie` and `Screen` at a specific `showTime`.
- **Booking**: Links `User`, `Show`, and multiple `BookingSeat`s.
- **SeatLock**: Temporary reservation for `(seatId, showId)` with `expiresAt`.
- **WaitlistEntry**: Tracks users waiting for a full `Show` to become available.

---

## Admin Management System

The Admin Dashboard (`/admin`) allows full control over the platform. Only users with the `ADMIN` role can access this view.

**Core Responsibilities & Data Flow:**
- **Movies**: Users do **NOT** see all movies from TMDB. The Admin must explicitly search for and add specific movies from TMDB to the local database (or add them manually). Only these admin-selected movies are available on the platform.
- **Theatres & Screens**: The Admin creates physical locations (Theatres) and the Screens within them. The system automatically generates `Seat` records based on the rows and seats-per-row configured by the Admin.
- **Shows**: The Admin schedules `Show` records by pairing an existing `Movie` with a `Screen` at a specific `showTime` and setting a `basePrice`. **Users can only see and book tickets for these explicitly scheduled Shows.**
- **Tickets/Bookings**: Regular users create tickets (`Booking` records) when they reserve and pay for seats for a Show. The Admin can view, filter, and monitor all system-wide bookings.
- **Stats**: The dashboard provides analytics on Total Users, Movies, Bookings, and Revenue.

## Environment Variables

### Backend (`.env`)
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`, `JWT_EXPIRES_IN`: Authentication config.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`: Optional; omitting enables Mock Mode.
- `FRONTEND_URL`: For CORS configuration.

### Frontend (`.env`)
- `REACT_APP_API_URL`: Backend base URL (default: `http://localhost:5000/api`).
- `REACT_APP_RAZORPAY_KEY`: Razorpay public key.

---

## Development Standards

- **Error Handling**: Always use `throw new AppError(message, status)` in services.
- **Responses**: Use `success(res, data)` and `created(res, data)` from `utils/response.utils`.
- **Frontend Calls**: Never use `axios` directly in components; always use the `services/` layer.
- **Tailwind**: Use the custom `darkBackground` and `premier` color palettes defined in `tailwind.config.js`.
- **Consistency**: IDs are generally `Int` (autoincrement) except for `User` and `Booking` (CUID/String).
