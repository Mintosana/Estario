import { z } from "zod";

const poiCategories = ["metro", "bus", "trolley", "tram", "healthcare", "education", "groceries"];

export const poiBoundsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z
    .object({
      north: z.coerce.number().min(-90).max(90),
      south: z.coerce.number().min(-90).max(90),
      east: z.coerce.number().min(-180).max(180),
      west: z.coerce.number().min(-180).max(180),
      categories: z
        .string()
        .trim()
        .optional()
        .transform((value) => (value ? value.split(",").map((category) => category.trim()).filter(Boolean) : poiCategories))
        .pipe(z.array(z.enum(poiCategories)).min(1))
    })
    .refine((query) => query.south <= query.north, {
      message: "Limitele nord/sud nu sunt valide.",
      path: ["south"]
    })
    .refine((query) => query.west <= query.east, {
      message: "Limitele est/vest nu sunt valide.",
      path: ["west"]
    })
});
