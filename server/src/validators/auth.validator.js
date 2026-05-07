import { z } from "zod";

const email = z
  .string({ required_error: "Emailul este obligatoriu." })
  .trim()
  .email("Emailul nu este valid.")
  .toLowerCase();

const password = z
  .string({ required_error: "Parola este obligatorie." })
  .min(8, "Parola trebuie sa aiba cel putin 8 caractere.")
  .regex(/[A-Z]/, "Parola trebuie sa contina cel putin o litera mare.")
  .regex(/[a-z]/, "Parola trebuie sa contina cel putin o litera mica.")
  .regex(/[0-9]/, "Parola trebuie sa contina cel putin o cifra.");

export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Numele este obligatoriu." })
      .trim()
      .min(2, "Numele trebuie sa aiba cel putin 2 caractere.")
      .max(80, "Numele este prea lung."),
    email,
    password
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string({ required_error: "Parola este obligatorie." }).min(1)
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional()
});
