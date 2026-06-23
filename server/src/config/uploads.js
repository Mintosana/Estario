import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadDir = process.env.UPLOAD_DIR ?? path.join(__dirname, "..", "..", "uploads");

fs.mkdirSync(uploadDir, { recursive: true });
