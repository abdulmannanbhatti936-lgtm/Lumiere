import { desc } from 'drizzle-orm';
import { contactMessageSchema } from '../../../shared/validation';
import { adminProcedure, publicProcedure, router } from '../trpc';
import { db, schema } from '../db';
import { sendContactAcknowledgement } from '../utils/email';

export const contactRouter = router({
  submit: publicProcedure.input(contactMessageSchema).mutation(async ({ input }) => {
    const [message] = await db.insert(schema.contactMessages).values(input).returning();
    void sendContactAcknowledgement(input.email, input.firstName);
    return { success: true, id: message.id };
  }),

  adminList: adminProcedure.query(async () => {
    return db.query.contactMessages.findMany({ orderBy: desc(schema.contactMessages.createdAt) });
  }),
});
