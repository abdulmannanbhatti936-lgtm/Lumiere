export const SITE_NAME = 'Lumiere Stays';
export const SITE_DESCRIPTION = 'Experience luxury travel with immersive 3D hotel browsing and seamless bookings';

export const NAVIGATION_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Hotels', href: '/hotels' },
  { label: 'Destinations', href: '/destinations' },
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
];

export const AMENITIES = [
  'WiFi',
  'Swimming Pool',
  'Spa',
  'Fitness Center',
  'Restaurant',
  'Bar',
  'Room Service',
  'Concierge',
  'Parking',
  'Airport Shuttle',
  'Pet Friendly',
  'Business Center',
];

export const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Suite',
  'Presidential Suite',
  'Penthouse',
];

export const PRICE_RANGES = [
  { label: 'Budget', min: 0, max: 150 },
  { label: 'Mid-range', min: 150, max: 300 },
  { label: 'Luxury', min: 300, max: 600 },
  { label: 'Ultra-luxury', min: 600, max: 2000 },
];

export const STAR_RATINGS = [1, 2, 3, 4, 5];

export const BOOKING_STEPS = ['dates', 'details', 'confirmation'] as const;

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const STORAGE_KEYS = {
  USER: 'lumiere_user',
  CART: 'lumiere_cart',
  PREFERENCES: 'lumiere_preferences',
  THEME: 'lumiere_theme',
};
