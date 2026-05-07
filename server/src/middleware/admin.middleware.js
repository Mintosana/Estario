import { AppError } from "../utils/AppError.js";

export function adminMiddleware(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return next(new AppError("Acces permis doar administratorilor.", 403));
  }

  return next();
}
