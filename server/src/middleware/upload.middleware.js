import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import { uploadDir } from "../config/uploads.js";
import { AppError } from "../utils/AppError.js";

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxFileSize = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    callback(null, safeName);
  }
});

const imageUpload = multer({
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
});

export const uploadImages = imageUpload.array("images", 10);

export const uploadAvatar = imageUpload.single("avatar");
