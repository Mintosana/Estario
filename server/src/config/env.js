import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["DATABASE_URL", "JWT_SECRET"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  clientUrls: [
    process.env.CLIENT_URL ?? "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5173"
  ],
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtSecret: process.env.JWT_SECRET,
  googleApiKey: process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
  googleModel: process.env.GOOGLE_MODEL ?? process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
  nodeEnv: process.env.NODE_ENV ?? "development",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
  port: Number(process.env.PORT ?? 5000),
  stripe: {
    currency: (process.env.STRIPE_CURRENCY ?? "eur").toLowerCase(),
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ""
  }
};
