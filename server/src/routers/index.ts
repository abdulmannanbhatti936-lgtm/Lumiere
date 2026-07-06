import { router } from '../trpc';
import { authRouter } from './auth.router';
import { destinationsRouter } from './destinations.router';
import { hotelsRouter } from './hotels.router';
import { roomsRouter } from './rooms.router';
import { bookingsRouter } from './bookings.router';
import { reviewsRouter } from './reviews.router';
import { usersRouter } from './users.router';
import { adminRouter } from './admin.router';
import { paymentsRouter } from './payments.router';

export const appRouter = router({
  auth: authRouter,
  destinations: destinationsRouter,
  hotels: hotelsRouter,
  rooms: roomsRouter,
  bookings: bookingsRouter,
  reviews: reviewsRouter,
  users: usersRouter,
  admin: adminRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
