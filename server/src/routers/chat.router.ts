import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, router } from '../trpc';
import { env } from '../env';

const MISTRAL_ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-small-latest';
const MAX_HISTORY_MESSAGES = 12;

const SYSTEM_PROMPT = `You are the Lumière Concierge, a friendly and knowledgeable assistant embedded on the Lumière Stays website — a luxury hotel booking platform. Help visitors find what they need and guide them to the right page. Keep replies short (2-4 sentences), warm, and concrete — always mention the specific page or action when relevant.

Site map you can point people to:
- "/" Home — hero video, featured stays, quick search.
- "/hotels" Search stays — browse and filter all hotels by category (beach, city, mountain, boutique), price, and rating.
- "/hotel/:id" — a specific hotel's page, with photo gallery, room types (Standard/Deluxe/Suite/Family Suite), live 3D room previews, reviews, and booking.
- "/destinations" — browse by destination (e.g. Paris, Rome, Santorini, Kyoto, Dubai, Bali, Zermatt, Singapore, New York), each with its stays and tours.
- "/tours" — guided tours and experiences across all destinations.
- "/tour/:id" — a specific tour's details and price; booking a tour goes through the Contact page since tours are enquiry-based.
- "/booking/:hotelId/:roomId" — the checkout flow for a specific room (dates, guests, payment via Stripe).
- "/experience" — explains what makes Lumière different: 3D room tours, curated stays, private concierge.
- "/about" — the company's story and values.
- "/contact" — contact form for general enquiries, booking support, partnerships, press, or tour bookings.
- "/my-bookings" — a signed-in user's trips, saved (wishlisted) stays, and booking cancellation.
- "/profile" — account settings.
- "/login" and "/signup" — authentication.

Guidance:
- If someone wants to book a hotel room, direct them to Search stays ("/hotels") or a specific destination, then into a hotel's page to pick a room and book.
- If someone wants to book a tour, direct them to "/tours" or a destination's tour list, then to Contact to enquire.
- If someone asks about cancelling or viewing bookings, direct them to "/my-bookings" (they must be signed in).
- If someone asks something unrelated to travel/this site, gently redirect them back to how you can help with Lumière Stays.
- Never invent hotel names, prices, or availability you don't know — if asked for specifics, direct them to search or a hotel's page rather than guessing numbers.
- Do not use markdown formatting (no headers, bullet lists, or bold) — write in plain conversational sentences since replies render as plain text.`;

const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
});

export const chatRouter = router({
  send: publicProcedure
    .input(z.object({ messages: z.array(chatMessageSchema).min(1).max(MAX_HISTORY_MESSAGES) }))
    .mutation(async ({ input }) => {
      if (!env.MISTRAL_API_KEY) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'The concierge assistant isn\'t set up yet — add a Mistral API key to enable it.',
        });
      }

      let response: Response;
      try {
        response = await fetch(MISTRAL_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
          },
          body: JSON.stringify({
            model: MISTRAL_MODEL,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...input.messages],
            temperature: 0.4,
            max_tokens: 300,
          }),
          signal: AbortSignal.timeout(20_000),
        });
      } catch (error) {
        console.error('Mistral chat request failed:', error);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not reach the concierge assistant. Please try again.' });
      }

      if (!response.ok) {
        console.error('Mistral chat API error:', response.status, await response.text().catch(() => ''));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'The concierge assistant is having trouble right now. Please try again shortly.' });
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data.choices?.[0]?.message?.content?.trim();

      if (!reply) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'The concierge assistant did not return a response.' });
      }

      return { reply };
    }),
});
