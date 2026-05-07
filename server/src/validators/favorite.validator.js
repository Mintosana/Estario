import { z } from "zod";

export const favoriteParamsSchema = z.object({
  params: z.object({
    listingId: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});
