import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import Hotels from '@/pages/Hotels';
import HotelDetail from '@/pages/HotelDetail';
import Booking from '@/pages/Booking';
import Dashboard from '@/pages/Dashboard';
import Destinations from '@/pages/Destinations';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import MyBookings from '@/pages/MyBookings';
import Profile from '@/pages/Profile';
import AdminHotels from '@/pages/admin/AdminHotels';
import AdminHotelRooms from '@/pages/admin/AdminHotelRooms';
import AdminDestinations from '@/pages/admin/AdminDestinations';
import AdminBookings from '@/pages/admin/AdminBookings';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminUsers from '@/pages/admin/AdminUsers';
import { Route, Switch } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/common/Navigation';
import Footer from './components/common/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/hotels" component={Hotels} />
      <Route path="/hotel/:id" component={HotelDetail} />
      <ProtectedRoute path="/booking/:hotelId/:roomId" component={Booking} />
      <ProtectedRoute path="/dashboard" component={Dashboard} adminOnly />
      <ProtectedRoute path="/admin/hotels/:hotelId/rooms" component={AdminHotelRooms} adminOnly />
      <ProtectedRoute path="/admin/hotels" component={AdminHotels} adminOnly />
      <ProtectedRoute path="/admin/destinations" component={AdminDestinations} adminOnly />
      <ProtectedRoute path="/admin/bookings" component={AdminBookings} adminOnly />
      <ProtectedRoute path="/admin/reviews" component={AdminReviews} adminOnly />
      <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly />
      <ProtectedRoute path="/my-bookings" component={MyBookings} />
      <ProtectedRoute path="/profile" component={Profile} />
      <Route path="/destinations" component={Destinations} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navigation />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
