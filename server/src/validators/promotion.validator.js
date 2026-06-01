import { z } from "zod";

export const buyPromotionBundleSchema = z.object({
  body: z.object({
    bundleKey: z.enum(["starter", "growth", "pro"]),
    returnPath: z
      .string()
      .startsWith("/", "Calea de intoarcere trebuie sa fie locala.")
      .max(200)
      .optional()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const sponsorListingSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  query: z.object({}).optional()
});
