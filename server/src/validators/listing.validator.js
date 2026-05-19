import { z } from "zod";
import {
  buildingConditions,
  centralHeatingTypes,
  compartmentalizationTypes,
  currencies,
  energyClasses,
  furnishingStatuses,
  heatingTypes,
  listingSortOptions,
  parkingTypes,
  propertyTypes,
  transactionTypes
} from "../constants/listingConstants.js";

const optionalPositiveInt = z.coerce.number().int().positive().optional().nullable();
const optionalInt = z.coerce.number().int().optional().nullable();
const optionalBooleanQuery = z
  .enum(["true", "false"])
  .transform((value) => value === "true")
  .optional();

const listingBodyBase = {
  title: z
    .string({ required_error: "Titlul este obligatoriu." })
    .trim()
    .min(8, "Titlul trebuie sa aiba cel putin 8 caractere.")
    .max(140, "Titlul este prea lung."),
  description: z
    .string({ required_error: "Descrierea este obligatorie." })
    .trim()
    .min(30, "Descrierea trebuie sa aiba cel putin 30 de caractere.")
    .max(5000, "Descrierea este prea lunga."),
  propertyType: z.enum(propertyTypes, {
    errorMap: () => ({ message: "Tipul proprietatii nu este valid." })
  }),
  transactionType: z.enum(transactionTypes, {
    errorMap: () => ({ message: "Tipul tranzactiei nu este valid." })
  }),
  price: z.coerce
    .number({ required_error: "Pretul este obligatoriu." })
    .positive("Pretul trebuie sa fie pozitiv."),
  currency: z.enum(currencies).default("EUR"),
  city: z
    .string({ required_error: "Orasul este obligatoriu." })
    .trim()
    .min(2, "Orasul este prea scurt.")
    .max(80, "Orasul este prea lung."),
  county: z
    .string({ required_error: "Judetul este obligatoriu." })
    .trim()
    .min(2, "Judetul este prea scurt.")
    .max(80, "Judetul este prea lung."),
  address: z
    .string({ required_error: "Adresa este obligatorie." })
    .trim()
    .min(5, "Adresa este prea scurta.")
    .max(180, "Adresa este prea lunga."),
  latitude: z.coerce
    .number({ required_error: "Latitudinea este obligatorie." })
    .min(-90)
    .max(90),
  longitude: z.coerce
    .number({ required_error: "Longitudinea este obligatorie." })
    .min(-180)
    .max(180),
  surface: z.coerce
    .number({ required_error: "Suprafata este obligatorie." })
    .int()
    .positive("Suprafata trebuie sa fie pozitiva."),
  rooms: optionalPositiveInt,
  bathrooms: optionalPositiveInt,
  floor: optionalInt,
  totalFloors: optionalPositiveInt,
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1800, "Anul constructiei nu este valid.")
    .max(new Date().getFullYear() + 1, "Anul constructiei nu este valid.")
    .optional()
    .nullable(),
  balcony: z.boolean().optional().nullable(),
  hasAirConditioning: z.boolean().optional().nullable(),
  hasElevator: z.boolean().optional().nullable(),
  petFriendly: z.boolean().optional().nullable(),
  compartmentalization: z.enum(compartmentalizationTypes).optional().nullable(),
  parking: z.enum(parkingTypes).optional().nullable(),
  furnished: z.enum(furnishingStatuses).optional().nullable(),
  heatingType: z.enum(heatingTypes).optional().nullable(),
  centralHeatingType: z.enum(centralHeatingTypes).optional().nullable(),
  buildingCondition: z.enum(buildingConditions).optional().nullable(),
  energyClass: z.enum(energyClasses).optional().nullable()
};

export const listingIdParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listingImageParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu."),
    imageId: z.string().min(1, "ID-ul imaginii este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listingImageOrderSchema = z.object({
  params: listingIdParamsSchema.shape.params,
  body: z.object({
    imageIds: z
      .array(z.string().min(1, "ID-ul imaginii este obligatoriu."))
      .min(1, "Trimite cel putin o imagine pentru ordonare.")
      .max(30, "Nu poti ordona mai mult de 30 de imagini odata.")
  }),
  query: z.object({}).optional()
});

export const createListingSchema = z.object({
  body: z.object(listingBodyBase),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const updateListingSchema = z.object({
  body: z.object(listingBodyBase).partial().refine((body) => Object.keys(body).length > 0, {
    message: "Trimite cel putin un camp pentru actualizare."
  }),
  params: listingIdParamsSchema.shape.params,
  query: z.object({}).optional()
});

export const listingFiltersSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z
    .object({
      city: z.string().trim().optional(),
      county: z.string().trim().optional(),
      propertyType: z.enum(propertyTypes).optional(),
      transactionType: z.enum(transactionTypes).optional(),
      currency: z.enum(currencies).optional(),
      minPrice: z.coerce.number().nonnegative().optional(),
      maxPrice: z.coerce.number().nonnegative().optional(),
      rooms: z.coerce.number().int().positive().optional(),
      balcony: optionalBooleanQuery,
      hasAirConditioning: optionalBooleanQuery,
      hasElevator: optionalBooleanQuery,
      petFriendly: optionalBooleanQuery,
      compartmentalization: z.enum(compartmentalizationTypes).optional(),
      parking: z.enum(parkingTypes).optional(),
      furnished: z.enum(furnishingStatuses).optional(),
      heatingType: z.enum(heatingTypes).optional(),
      centralHeatingType: z.enum(centralHeatingTypes).optional(),
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(50).default(12),
      sort: z.enum(listingSortOptions).default("relevance")
    })
    .refine(
      (query) =>
        query.minPrice === undefined ||
        query.maxPrice === undefined ||
        query.minPrice <= query.maxPrice,
      {
        message: "Pretul minim nu poate fi mai mare decat pretul maxim.",
        path: ["minPrice"]
      }
    )
});

export const naturalListingSearchSchema = z.object({
  body: z.object({
    query: z
      .string({ required_error: "Descrie ce fel de proprietate cauti." })
      .trim()
      .min(3, "Descrierea cautarii este prea scurta.")
      .max(500, "Descrierea cautarii este prea lunga.")
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listingQualitySchema = z.object({
  body: z.object({
    title: z.string().trim().max(140, "Titlul este prea lung.").optional().nullable(),
    description: z.string().trim().max(5000, "Descrierea este prea lunga.").optional().nullable(),
    propertyType: z.enum(propertyTypes).optional().nullable(),
    transactionType: z.enum(transactionTypes).optional().nullable(),
    price: z.coerce.number().positive("Pretul trebuie sa fie pozitiv.").optional().nullable(),
    currency: z.enum(currencies).optional().nullable(),
    city: z.string().trim().max(80, "Orasul este prea lung.").optional().nullable(),
    county: z.string().trim().max(80, "Judetul este prea lung.").optional().nullable(),
    address: z.string().trim().max(180, "Adresa este prea lunga.").optional().nullable(),
    latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
    longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
    surface: z.coerce.number().int().positive("Suprafata trebuie sa fie pozitiva.").optional().nullable(),
    rooms: optionalPositiveInt,
    bathrooms: optionalPositiveInt,
    floor: optionalInt,
    totalFloors: optionalPositiveInt,
    yearBuilt: z.coerce
      .number()
      .int()
      .min(1800, "Anul constructiei nu este valid.")
      .max(new Date().getFullYear() + 1, "Anul constructiei nu este valid.")
      .optional()
      .nullable(),
    balcony: z.boolean().optional().nullable(),
    hasAirConditioning: z.boolean().optional().nullable(),
    hasElevator: z.boolean().optional().nullable(),
    petFriendly: z.boolean().optional().nullable(),
    compartmentalization: z.enum(compartmentalizationTypes).optional().nullable(),
    parking: z.enum(parkingTypes).optional().nullable(),
    furnished: z.enum(furnishingStatuses).optional().nullable(),
    heatingType: z.enum(heatingTypes).optional().nullable(),
    centralHeatingType: z.enum(centralHeatingTypes).optional().nullable(),
    buildingCondition: z.enum(buildingConditions).optional().nullable(),
    energyClass: z.enum(energyClasses).optional().nullable(),
    imageCount: z.coerce.number().int().min(0).max(30).default(0)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const listingDescriptionSchema = z.object({
  body: z.object({
    title: z.string().trim().max(140, "Titlul este prea lung.").optional().nullable(),
    propertyType: z.enum(propertyTypes),
    transactionType: z.enum(transactionTypes),
    price: z.coerce.number().positive("Pretul trebuie sa fie pozitiv.").optional().nullable(),
    currency: z.enum(currencies).default("EUR"),
    city: z.string().trim().max(80, "Orasul este prea lung.").optional().nullable(),
    county: z.string().trim().max(80, "Judetul este prea lung.").optional().nullable(),
    address: z.string().trim().max(180, "Adresa este prea lunga.").optional().nullable(),
    surface: z.coerce.number().int().positive("Suprafata trebuie sa fie pozitiva.").optional().nullable(),
    rooms: optionalPositiveInt,
    bathrooms: optionalPositiveInt,
    floor: optionalInt,
    totalFloors: optionalPositiveInt,
    yearBuilt: z.coerce
      .number()
      .int()
      .min(1800, "Anul constructiei nu este valid.")
      .max(new Date().getFullYear() + 1, "Anul constructiei nu este valid.")
      .optional()
      .nullable(),
    balcony: z.boolean().optional().nullable(),
    hasAirConditioning: z.boolean().optional().nullable(),
    hasElevator: z.boolean().optional().nullable(),
    petFriendly: z.boolean().optional().nullable(),
    compartmentalization: z.enum(compartmentalizationTypes).optional().nullable(),
    parking: z.enum(parkingTypes).optional().nullable(),
    furnished: z.enum(furnishingStatuses).optional().nullable(),
    heatingType: z.enum(heatingTypes).optional().nullable(),
    centralHeatingType: z.enum(centralHeatingTypes).optional().nullable(),
    buildingCondition: z.enum(buildingConditions).optional().nullable(),
    energyClass: z.enum(energyClasses).optional().nullable()
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
