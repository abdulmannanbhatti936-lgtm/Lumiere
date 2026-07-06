import { and, eq, gt, inArray, lt } from 'drizzle-orm';
import { db, schema } from '../db';

const BLOCKING_STATUSES: Array<'pending' | 'confirmed'> = ['pending', 'confirmed'];

export function nightsBetween(checkIn: string, checkOut: string) {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export async function countOverlappingBookings(roomId: number, checkIn: string, checkOut: string) {
  const overlapping = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.roomId, roomId),
        inArray(schema.bookings.status, BLOCKING_STATUSES),
        lt(schema.bookings.checkIn, checkOut),
        gt(schema.bookings.checkOut, checkIn),
      ),
    );
  return overlapping.length;
}

export async function isRoomAvailable(roomId: number, checkIn: string, checkOut: string) {
  const room = await db.query.rooms.findFirst({ where: eq(schema.rooms.id, roomId) });
  if (!room) return { available: false, room: undefined };

  const overlapCount = await countOverlappingBookings(roomId, checkIn, checkOut);
  return { available: overlapCount < room.totalUnits, room };
}
