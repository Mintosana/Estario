import { prisma } from "../config/prisma.js";
import { publicListingInclude } from "../constants/listingConstants.js";
import { AppError } from "../utils/AppError.js";
import { serializeListings } from "../utils/listingSerializer.js";

export async function getFavorites(userId) {
  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      listing: {
        status: "APPROVED"
      }
    },
    include: {
      listing: {
        include: publicListingInclude
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return serializeListings(favorites.map((favorite) => favorite.listing));
}

export async function addFavorite(userId, listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      status: true
    }
  });

  if (!listing || listing.status !== "APPROVED") {
    throw new AppError("Poti adauga la favorite doar anunturi aprobate.", 404);
  }

  const existingFavorite = await prisma.favorite.findUnique({
    where: {
      userId_listingId: {
        userId,
        listingId
      }
    }
  });

  if (existingFavorite) {
    throw new AppError("Anuntul este deja in lista de favorite.", 409);
  }

  await prisma.favorite.create({
    data: {
      userId,
      listingId
    }
  });
}

export async function removeFavorite(userId, listingId) {
  const result = await prisma.favorite.deleteMany({
    where: {
      userId,
      listingId
    }
  });

  if (result.count === 0) {
    throw new AppError("Favoritul nu a fost gasit.", 404);
  }
}
