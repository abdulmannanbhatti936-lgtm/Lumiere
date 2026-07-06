import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(255),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const hotelsQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  city: z.string().trim().max(255).optional(),
  destinationId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  minStars: z.coerce.number().int().min(1).max(5).optional(),
  sortBy: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export type HotelsQueryInput = z.infer<typeof hotelsQuerySchema>;

export const hotelWriteSchema = z.object({
  destinationId: z.coerce.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(255),
  city: z.string().trim().min(1).max(255),
  country: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  starRating: z.coerce.number().int().min(1).max(5).default(5),
  basePrice: z.coerce.number().positive(),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  amenities: z.array(z.string().trim().min(1)).default([]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});
export type HotelWriteInput = z.infer<typeof hotelWriteSchema>;
// Pre-coercion shape (what an HTML form actually produces, e.g. numbers as strings) —
// pair with HotelWriteInput as useForm's <TFieldValues, TContext, TTransformedValues>.
export type HotelWriteFormInput = z.input<typeof hotelWriteSchema>;

export const roomWriteSchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  capacity: z.coerce.number().int().min(1).max(20).default(2),
  pricePerNight: z.coerce.number().positive(),
  totalUnits: z.coerce.number().int().min(1).default(1),
  imageUrl: z.string().url().optional(),
  images: z.array(z.string().url()).default([]),
  amenities: z.array(z.string().trim().min(1)).default([]),
});
export type RoomWriteInput = z.infer<typeof roomWriteSchema>;
export type RoomWriteFormInput = z.input<typeof roomWriteSchema>;

export const bookingCreateSchema = z
  .object({
    hotelId: z.coerce.number().int().positive(),
    roomId: z.coerce.number().int().positive(),
    checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkIn must be YYYY-MM-DD'),
    checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'checkOut must be YYYY-MM-DD'),
    guests: z.coerce.number().int().min(1).max(20).default(1),
    guestName: z.string().trim().min(1).max(255).optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().trim().max(32).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
  })
  .refine((data) => data.checkOut > data.checkIn, {
    message: 'checkOut must be after checkIn',
    path: ['checkOut'],
  });
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;

export const reviewCreateSchema = z.object({
  hotelId: z.coerce.number().int().positive(),
  bookingId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  phone: z.string().trim().max(32).optional(),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const destinationWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  country: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  featured: z.boolean().default(false),
});
export type DestinationWriteInput = z.infer<typeof destinationWriteSchema>;
export type DestinationWriteFormInput = z.input<typeof destinationWriteSchema>;
