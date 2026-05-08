import { z } from "zod";

export const createMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({
    message: z
      .string({ required_error: "Mesajul este obligatoriu." })
      .trim()
      .min(10, "Mesajul trebuie sa aiba cel putin 10 caractere.")
      .max(2000, "Mesajul este prea lung.")
  }),
  query: z.object({}).optional()
});

export const listingMessagesParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul anuntului este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const conversationParamsSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul conversatiei este obligatoriu.")
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional()
});

export const replyMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID-ul conversatiei este obligatoriu.")
  }),
  body: z.object({
    message: z
      .string({ required_error: "Mesajul este obligatoriu." })
      .trim()
      .min(2, "Mesajul trebuie sa aiba cel putin 2 caractere.")
      .max(2000, "Mesajul este prea lung.")
  }),
  query: z.object({}).optional()
});
