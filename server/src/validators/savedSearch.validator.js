import { z } from "zod";
import {
  furnishingStatuses,
  listingSortOptions,
  parkingTypes,
  propertyTypes,
  transactionTypes
} from "../constants/listingConstants.js";

const savedSearchBodyBase = z.object({
  name: z
    .string({ required_error: "Numele cautarii este obligatoriu." })
    .trim()
    .min(2, "Numele cautarii este prea scurt.")
    .max(80, "Numele cautarii este prea lung."),
  city: z.string().trim().max(80, "Orasul este prea lung.").optional().nullable(),
  county: z.string().trim().max(80, "Judetul este prea lung.").optional().nullable(),
  propertyType: z.enum(propertyTypes).optional().nullable(),
  transactionType: z.enum(transactionTypes).optional().nullable(),
  minPrice: z.coerce.number().nonnegative().optional().nullable(),
  maxPrice: z.coerce.number().nonnegative().optional().nullable(),
  rooms: z.coerce.number().int().positive().optional().nullable(),
  balcony: z.boolean().optional().nullable(),
  parking: z.enum(parkingTypes).optional().nullable(),
  furnished: z.enum(furnishingStatuses).optional().nullable(),
  hasOwnCentralHeating: z.boolean().optional().nullable(),
  sort: z.enum(listingSortOptions).default("newest")
});

const savedSearchPriceRangeRefinement = [
  (body) =>
    body.minPrice === undefined ||
    body.minPrice === null ||
    body.maxPrice === undefined ||
    body.maxPrice === null ||
    body.minPrice <= body.maxPrice,
  {
    message: "Pretul minim nu poate fi mai mare decat pretul maxim.",
    path: ["minPrice"]
  }
];

const savedSearchBody = savedSearchBodyBase
  .refine(
    savedSearchPriceRangeRefinement[0],
    savedSearchPriceRangeRefinement[1]
  );

const savedSearchUpdateBody = savedSearchBodyBase
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: "Trimite cel putin un camp pentru actualizare."
  })
  .refine(
    savedSearchPriceRangeRefinement[0],
    savedSearchPriceRangeRefinement[1]
  );

export const savedSearchParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul cautarii este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const createSavedSearchSchema = z.object({
  body: savedSearchBody,
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateSavedSearchSchema = z.object({
  body: savedSearchUpdateBody,
  params: savedSearchParamsSchema.shape.params,
  query: z.object({}).optional()
});
