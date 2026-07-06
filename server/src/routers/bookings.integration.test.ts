import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { createTestCaller } from '../test-utils';

describe('bookings.create overlap enforcement (integration, real DB)', () => {
  let destinationId: number;
  let hotelId: number;
  let roomId: number;
  let userId: number;

  beforeAll(async () => {
    const [destination] = await db
      .insert(schema.destinations)
      .values({ name: 'Integration Test City', country: 'Testland' })
      .returning();
    destinationId = destination.id;

    const [hotel] = await db
      .insert(schema.hotels)
      .values({
        destinationId,
        name: 'Integration Test Hotel',
        slug: `integration-test-hotel-${Date.now()}`,
        city: 'Test City',
        country: 'Testland',
        basePrice: '100.00',
      })
      .returning();
    hotelId = hotel.id;

    const [room] = await db
      .insert(schema.rooms)
      .values({ hotelId, name: 'Test Room', pricePerNight: '100.00', totalUnits: 1 })
      .returning();
    roomId = room.id;

    const [user] = await db
      .insert(schema.users)
      .values({
        email: `integration-test-${Date.now()}@example.com`,
        passwordHash: 'not-a-real-hash',
        name: 'Integration Tester',
      })
      .returning();
    userId = user.id;
  });

  afterAll(async () => {
    await db.delete(schema.bookings).where(eq(schema.bookings.roomId, roomId));
    await db.delete(schema.rooms).where(eq(schema.rooms.id, roomId));
    await db.delete(schema.hotels).where(eq(schema.hotels.id, hotelId));
    await db.delete(schema.destinations).where(eq(schema.destinations.id, destinationId));
    await db.delete(schema.users).where(eq(schema.users.id, userId));
  });

  it('allows the first booking for a fully-available room', async () => {
    const caller = createTestCaller({ sub: userId, email: 'x@example.com', role: 'user' });
    const booking = await caller.bookings.create({
      hotelId,
      roomId,
      checkIn: '2027-01-10',
      checkOut: '2027-01-12',
      guests: 1,
    });
    expect(booking.status).toBe('pending');
    expect(booking.totalPrice).toBe('200.00');
  });

  it('rejects an overlapping booking once totalUnits is exhausted', async () => {
    const caller = createTestCaller({ sub: userId, email: 'x@example.com', role: 'user' });
    await expect(
      caller.bookings.create({
        hotelId,
        roomId,
        checkIn: '2027-01-11',
        checkOut: '2027-01-13',
        guests: 1,
      }),
    ).rejects.toThrow(/not available/i);
  });

  it('allows a non-overlapping booking for the same room', async () => {
    const caller = createTestCaller({ sub: userId, email: 'x@example.com', role: 'user' });
    const booking = await caller.bookings.create({
      hotelId,
      roomId,
      checkIn: '2027-02-01',
      checkOut: '2027-02-03',
      guests: 1,
    });
    expect(booking.status).toBe('pending');
  });
});
