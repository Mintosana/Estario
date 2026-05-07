import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AppError } from "../utils/AppError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, path.join(__dirname, "..", "..", "uploads"));
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    callback(null, safeName);
  }
});

export const uploadImages = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 10
  },
  fileFilter(req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return callback(new AppError("Sunt permise doar imagini JPEG, PNG sau WebP.", 400));
    }

    return callback(null, true);
  }
}).array("images", 10);
