import { z } from "zod";

export const adminListingParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const rejectListingSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({
    reason: z
      .string({ required_error: "Motivul respingerii este obligatoriu." })
      .trim()
      .min(5, "Motivul respingerii trebuie sa aiba cel putin 5 caractere.")
      .max(500, "Motivul respingerii este prea lung.")
  }),
  query: z.object({}).optional()
});
