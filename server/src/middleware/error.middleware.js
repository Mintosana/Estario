import { env } from "../config/env.js";

export function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode ?? 500;

  res.status(statusCode).json({
    message: error.message ?? "A aparut o eroare neasteptata.",
    errors: error.errors ?? [],
    ...(env.nodeEnv === "production" ? {} : { stack: error.stack })
  });
}
