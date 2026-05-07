import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

function getBearerToken(req) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

async function attachUserFromToken(req, token) {
  const payload = verifyToken(token);

  if (!payload?.sub) {
    throw new AppError("Token invalid.", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub }
  });

  if (!user) {
    throw new AppError("Utilizatorul nu mai exista.", 401);
  }

  req.user = user;
}

export async function authMiddleware(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      throw new AppError("Autentificarea este necesara.", 401);
    }

    await attachUserFromToken(req, token);
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError("Token invalid sau expirat.", 401));
  }
}

export async function optionalAuthMiddleware(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (token) {
      await attachUserFromToken(req, token);
    }

    next();
  } catch (error) {
    next();
  }
}
