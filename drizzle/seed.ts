import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { destinations, hotels, rooms, tours, users } from './schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(__dirname, '../server/.env') });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set — copy server/.env.example to server/.env first');
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to run the destructive seed script against a production database.');
}

const client = postgres(databaseUrl, { max: 1 });
const db = drizzle(client);

const DESTINATIONS = [
  { name: 'Paris', country: 'France', description: 'The City of Light — timeless elegance on the Seine.', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop', latitude: '48.856613', longitude: '2.352222', featured: true },
  { name: 'Singapore', country: 'Singapore', description: 'A gleaming garden city where East meets West.', imageUrl: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop', latitude: '1.352083', longitude: '103.819836', featured: true },
  { name: 'Zermatt', country: 'Switzerland', description: 'Alpine luxury in the shadow of the Matterhorn.', imageUrl: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800&h=600&fit=crop', latitude: '46.020707', longitude: '7.749159', featured: false },
  { name: 'Bali', country: 'Indonesia', description: 'Tropical paradise of temples, beaches and rice terraces.', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop', latitude: '-8.409518', longitude: '115.188919', featured: true },
  { name: 'New York', country: 'USA', description: 'The city that never sleeps.', imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop', latitude: '40.712776', longitude: '-74.005974', featured: false },
  { name: 'Dubai', country: 'UAE', description: 'Futuristic skyline rising from the desert.', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop', latitude: '25.204849', longitude: '55.270782', featured: true },
] as const;

const HOTELS = [
  {
    destination: 'Paris', name: 'Grand Luxe Palace', city: 'Paris', country: 'France', starRating: 5, basePrice: '450.00', category: 'city' as const,
    description: 'An opulent palace hotel steps from the Champs-Élysées, blending Belle Époque grandeur with modern luxury.',
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&h=800&fit=crop'],
    amenities: ['WiFi', 'Spa', 'Restaurant', 'Pool'],
  },
  {
    destination: 'Singapore', name: 'Marina Bay Suites', city: 'Singapore', country: 'Singapore', starRating: 5, basePrice: '380.00', category: 'city' as const,
    description: 'Sky-high infinity views over Marina Bay with world-class dining and a rooftop bar.',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop'],
    amenities: ['WiFi', 'Gym', 'Bar', 'Concierge'],
  },
  {
    destination: 'Zermatt', name: 'Alpine Retreat', city: 'Zermatt', country: 'Switzerland', starRating: 4, basePrice: '520.00', category: 'mountain' as const,
    description: 'A cozy mountain lodge with Matterhorn views, roaring fireplaces and a private sauna.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=800&fit=crop'],
    amenities: ['Fireplace', 'Mountain View', 'Sauna', 'Restaurant'],
  },
  {
    destination: 'Bali', name: 'Tropical Paradise Resort', city: 'Bali', country: 'Indonesia', starRating: 4, basePrice: '220.00', category: 'beach' as const,
    description: 'Beachfront villas surrounded by lush gardens and a full-service spa.',
    imageUrl: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&h=800&fit=crop'],
    amenities: ['Beach Access', 'Pool', 'Spa', 'WiFi'],
  },
  {
    destination: 'New York', name: 'Manhattan Tower', city: 'New York', country: 'USA', starRating: 5, basePrice: '650.00', category: 'city' as const,
    description: 'A landmark tower with panoramic city views and a celebrated rooftop bar.',
    imageUrl: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1522083165195-3424ed129620?w=1200&h=800&fit=crop'],
    amenities: ['City View', 'Rooftop Bar', 'Gym', 'Restaurant'],
  },
  {
    destination: 'Dubai', name: 'Desert Oasis', city: 'Dubai', country: 'UAE', starRating: 5, basePrice: '550.00', category: 'boutique' as const,
    description: 'A serene retreat combining Arabian hospitality with ultra-modern design.',
    imageUrl: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=500&h=300&fit=crop',
    images: ['https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1200&h=800&fit=crop'],
    amenities: ['Pool', 'Spa', 'Restaurant', 'Concierge'],
  },
] as const;

const ROOM_TEMPLATES = [
  { name: 'Standard Room', capacity: 2, multiplier: 1, totalUnits: 10 },
  { name: 'Deluxe Room', capacity: 2, multiplier: 1.4, totalUnits: 6 },
  { name: 'Suite', capacity: 4, multiplier: 2.1, totalUnits: 3 },
] as const;

const TOURS = [
  {
    destination: 'Paris', name: 'Louvre & Left Bank Walk', category: 'Small group', durationDays: 1, groupSize: 8, pricePerPerson: '95.00',
    description: 'A half-day guided walk through the Louvre courtyards and the Left Bank’s literary cafés.',
    imageUrl: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&h=600&fit=crop',
  },
  {
    destination: 'Singapore', name: 'Hawker Trail & Night Market', category: 'Food & Culture', durationDays: 1, groupSize: 10, pricePerPerson: '65.00',
    description: 'Taste your way through Singapore’s legendary hawker centres with a local food guide.',
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&h=600&fit=crop',
  },
  {
    destination: 'Zermatt', name: 'Matterhorn Glacier Trek', category: 'Adventure', durationDays: 2, groupSize: 6, pricePerPerson: '340.00',
    description: 'A two-day guided trek across the Gorner Glacier with an overnight mountain-hut stay.',
    imageUrl: 'https://images.unsplash.com/photo-1544198365-f5d60b6d8190?w=800&h=600&fit=crop',
  },
  {
    destination: 'Bali', name: 'Rice Terraces & Temple Sunrise', category: 'Adventure', durationDays: 1, groupSize: 12, pricePerPerson: '80.00',
    description: 'Sunrise over the Tegallalang rice terraces, followed by a private temple ceremony.',
    imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=600&fit=crop',
  },
  {
    destination: 'New York', name: 'Manhattan Skyline by Night', category: 'Small group', durationDays: 1, groupSize: 8, pricePerPerson: '110.00',
    description: 'A guided evening walk from the High Line to Top of the Rock for the city lit up in gold.',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop',
  },
  {
    destination: 'Dubai', name: 'Desert Safari & Bedouin Camp', category: 'Adventure', durationDays: 1, groupSize: 10, pricePerPerson: '150.00',
    description: 'Dune bashing, camel riding and a Bedouin-style dinner under the stars.',
    imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  },
] as const;

async function main() {
  console.log('Seeding database...');

  await client`TRUNCATE TABLE reviews, bookings, rooms, hotels, tours, wishlists, contact_messages, destinations, users, sessions, login_attempts RESTART IDENTITY CASCADE`;

  const insertedDestinations = await db.insert(destinations).values(DESTINATIONS.map((d) => ({
    name: d.name,
    country: d.country,
    description: d.description,
    imageUrl: d.imageUrl,
    latitude: d.latitude,
    longitude: d.longitude,
    featured: d.featured,
  }))).returning();

  const destinationIdByName = new Map(insertedDestinations.map((d) => [d.name, d.id]));

  for (const hotel of HOTELS) {
    const [insertedHotel] = await db.insert(hotels).values({
      destinationId: destinationIdByName.get(hotel.destination) ?? null,
      name: hotel.name,
      slug: hotel.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      city: hotel.city,
      country: hotel.country,
      description: hotel.description,
      category: hotel.category,
      starRating: hotel.starRating,
      basePrice: hotel.basePrice,
      imageUrl: hotel.imageUrl,
      images: [...hotel.images],
      amenities: [...hotel.amenities],
    }).returning();

    const base = Number(hotel.basePrice);
    await db.insert(rooms).values(ROOM_TEMPLATES.map((room) => ({
      hotelId: insertedHotel.id,
      name: room.name,
      description: `${room.name} at ${hotel.name} — sleeps up to ${room.capacity} guests.`,
      capacity: room.capacity,
      pricePerNight: (base * room.multiplier).toFixed(2),
      totalUnits: room.totalUnits,
      imageUrl: hotel.imageUrl,
      images: [...hotel.images],
      amenities: [...hotel.amenities],
    })));
  }

  await db.insert(tours).values(TOURS.map((tour) => ({
    destinationId: destinationIdByName.get(tour.destination)!,
    name: tour.name,
    description: tour.description,
    category: tour.category,
    durationDays: tour.durationDays,
    groupSize: tour.groupSize,
    pricePerPerson: tour.pricePerPerson,
    imageUrl: tour.imageUrl,
    images: [tour.imageUrl],
  })));

  const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
  const userPasswordHash = await bcrypt.hash('User123!', 12);

  await db.insert(users).values([
    { email: 'admin@lumierestays.com', passwordHash: adminPasswordHash, name: 'Lumiere Admin', role: 'admin' },
    { email: 'user@lumierestays.com', passwordHash: userPasswordHash, name: 'Demo Guest', role: 'user' },
  ]);

  console.log('Seed complete:');
  console.log(`  - ${insertedDestinations.length} destinations`);
  console.log(`  - ${HOTELS.length} hotels (${HOTELS.length * ROOM_TEMPLATES.length} rooms)`);
  console.log(`  - ${TOURS.length} tours`);
  console.log('  - demo admin: admin@lumierestays.com / Admin123!');
  console.log('  - demo user:  user@lumierestays.com / User123!');

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
