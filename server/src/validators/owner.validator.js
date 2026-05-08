import { z } from "zod";

export const ownerParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul proprietarului este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});
