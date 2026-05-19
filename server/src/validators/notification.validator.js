import { z } from "zod";

export const notificationParamsSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    id: z.string().min(1, "ID-ul notificarii este obligatoriu.")
  }),
  query: z.object({}).optional()
});
