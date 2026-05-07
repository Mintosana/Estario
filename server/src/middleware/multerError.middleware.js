import multer from "multer";
import { AppError } from "../utils/AppError.js";

export function multerErrorMiddleware(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    return next(new AppError("Upload-ul imaginii nu este valid.", 400, [error.message]));
  }

  return next(error);
}
