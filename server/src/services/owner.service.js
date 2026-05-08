import { prisma } from "../config/prisma.js";
import { publicListingInclude } from "../constants/listingConstants.js";
import { AppError } from "../utils/AppError.js";
import { serializeListings } from "../utils/listingSerializer.js";

export async function getPublicOwnerProfile(ownerId) {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      phone: true,
      bio: true,
      createdAt: true
    }
  });

  if (!owner) {
    throw new AppError("Proprietarul nu a fost gasit.", 404);
  }

  const listings = await prisma.listing.findMany({
    where: {
      ownerId,
      status: "APPROVED"
    },
    include: publicListingInclude,
    orderBy: {
      createdAt: "desc"
    }
  });

  return {
    owner,
    listings: serializeListings(listings)
  };
}
