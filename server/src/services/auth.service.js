import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";
import { comparePassword, hashPassword } from "../utils/password.js";
import { createUploadUrl } from "../utils/fileUrl.js";
import { toPublicUser } from "../utils/publicUser.js";

function createAuthResponse(user) {
  return {
    token: signToken({ sub: user.id, role: user.role }),
    user: toPublicUser(user)
  };
}

export async function registerUser({ name, email, password }) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError("Exista deja un cont cu acest email.", 409);
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password)
    }
  });

  return createAuthResponse(user);
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError("Emailul sau parola sunt incorecte.", 401);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Emailul sau parola sunt incorecte.", 401);
  }

  return createAuthResponse(user);
}

export function getCurrentUser(user) {
  return toPublicUser(user);
}

export async function updateUserProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      phone: data.phone || null,
      bio: data.bio || null
    }
  });

  return toPublicUser(user);
}

export async function updateUserAvatar(userId, file) {
  if (!file) {
    throw new AppError("Selecteaza o imagine pentru profil.", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      avatarUrl: createUploadUrl(file.filename)
    }
  });

  return toPublicUser(user);
}
