import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import { Route, Switch, useLocation } from 'wouter';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/common/Navigation';
import MobileTabBar from './components/common/MobileTabBar';
import Preloader from './components/common/Preloader';
import Footer from './components/common/Footer';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import PageTransition from './components/motion/PageTransition';

const Hotels = lazy(() => import('@/pages/Hotels'));
const HotelDetail = lazy(() => import('@/pages/HotelDetail'));
const Booking = lazy(() => import('@/pages/Booking'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Destinations = lazy(() => import('@/pages/Destinations'));
const Tours = lazy(() => import('@/pages/Tours'));
const TourDetail = lazy(() => import('@/pages/TourDetail'));
const Contact = lazy(() => import('@/pages/Contact'));
const Experience = lazy(() => import('@/pages/Experience'));
const About = lazy(() => import('@/pages/About'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const Terms = lazy(() => import('@/pages/Terms'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const MyBookings = lazy(() => import('@/pages/MyBookings'));
const Profile = lazy(() => import('@/pages/Profile'));
const AdminHotels = lazy(() => import('@/pages/admin/AdminHotels'));
const AdminHotelRooms = lazy(() => import('@/pages/admin/AdminHotelRooms'));
const AdminDestinations = lazy(() => import('@/pages/admin/AdminDestinations'));
const AdminTours = lazy(() => import('@/pages/admin/AdminTours'));
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
const AdminReviews = lazy(() => import('@/pages/admin/AdminReviews'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'));

function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-accent" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/hotels" component={Hotels} />
        <Route path="/hotel/:id" component={HotelDetail} />
        <ProtectedRoute path="/booking/:hotelId/:roomId" component={Booking} />
        <ProtectedRoute path="/dashboard" component={Dashboard} adminOnly />
        <ProtectedRoute path="/admin/hotels/:hotelId/rooms" component={AdminHotelRooms} adminOnly />
        <ProtectedRoute path="/admin/hotels" component={AdminHotels} adminOnly />
        <ProtectedRoute path="/admin/destinations" component={AdminDestinations} adminOnly />
        <ProtectedRoute path="/admin/tours" component={AdminTours} adminOnly />
        <ProtectedRoute path="/admin/bookings" component={AdminBookings} adminOnly />
        <ProtectedRoute path="/admin/reviews" component={AdminReviews} adminOnly />
        <ProtectedRoute path="/admin/users" component={AdminUsers} adminOnly />
        <ProtectedRoute path="/admin/analytics" component={AdminAnalytics} adminOnly />
        <ProtectedRoute path="/my-bookings" component={MyBookings} />
        <ProtectedRoute path="/profile" component={Profile} />
        <Route path="/destinations" component={Destinations} />
        <Route path="/tours" component={Tours} />
        <Route path="/tour/:id" component={TourDetail} />
        <Route path="/contact" component={Contact} />
        <Route path="/experience" component={Experience} />
        <Route path="/about" component={About} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/terms" component={Terms} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  const [location] = useLocation();
  const isChromeless = location === '/'; // Home's hero sits behind the floating navbar itself

  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Preloader />
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <Navigation />
          <main className={`flex-1 pb-24 md:pb-0 ${isChromeless ? '' : 'pt-[76px] md:pt-[110px]'}`}>
            <PageTransition>
              <Router />
            </PageTransition>
          </main>
          <Footer />
        </div>
        <MobileTabBar />
        <Toaster />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
