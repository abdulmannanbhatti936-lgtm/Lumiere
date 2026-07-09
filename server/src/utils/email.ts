import { Resend } from 'resend';
import { env } from '../env';

const resend = new Resend(env.RESEND_API_KEY ?? '');

async function send(to: string, subject: string, html: string) {
  try {
    // The Resend SDK does not throw on API-level failures (e.g. an unverified
    // sending domain) — those come back as a resolved { error } value instead.
    const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    if (error) {
      console.error(`Failed to send email "${subject}" to ${to}:`, error);
    }
  } catch (error) {
    console.error(`Failed to send email "${subject}" to ${to}:`, error);
  }
}

export function sendWelcomeEmail(to: string, name: string | null) {
  return send(
    to,
    'Welcome to Lumiere Stays',
    `<h1>Welcome, ${name ?? 'traveler'}!</h1><p>Your Lumiere Stays account is ready. Start exploring luxury hotels worldwide.</p>`,
  );
}

interface BookingEmailDetails {
  guestName: string;
  hotelName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: string;
  confirmationNumber: number;
}

export function sendBookingConfirmedEmail(to: string, booking: BookingEmailDetails) {
  return send(
    to,
    `Booking Confirmed — ${booking.hotelName}`,
    `<h1>Your booking is confirmed!</h1>
     <p>Hi ${booking.guestName}, your stay at <strong>${booking.hotelName}</strong> (${booking.roomName}) is confirmed.</p>
     <ul>
       <li>Confirmation number: LUM-${booking.confirmationNumber}</li>
       <li>Check-in: ${booking.checkIn}</li>
       <li>Check-out: ${booking.checkOut}</li>
       <li>Total paid: $${booking.totalPrice}</li>
     </ul>
     <p>We look forward to hosting you.</p>`,
  );
}

export function sendBookingCancelledEmail(to: string, booking: BookingEmailDetails) {
  return send(
    to,
    `Booking Cancelled — ${booking.hotelName}`,
    `<h1>Your booking has been cancelled</h1>
     <p>Hi ${booking.guestName}, your booking (confirmation LUM-${booking.confirmationNumber}) at <strong>${booking.hotelName}</strong> for ${booking.checkIn} – ${booking.checkOut} has been cancelled.</p>`,
  );
}

export function sendContactAcknowledgement(to: string, firstName: string) {
  return send(
    to,
    'We received your message — Lumière Stays',
    `<h1>Thanks for reaching out, ${firstName}!</h1>
     <p>Our team has received your message and will get back to you shortly.</p>`,
  );
}
