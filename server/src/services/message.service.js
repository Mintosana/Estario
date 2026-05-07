import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

async function findListingOwnerOrThrow(listingId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      id: true,
      ownerId: true,
      status: true
    }
  });

  if (!listing) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  return listing;
}

export async function createMessage(listingId, data, user) {
  const listing = await findListingOwnerOrThrow(listingId);

  if (listing.status !== "APPROVED") {
    throw new AppError("Mesajele pot fi trimise doar pentru anunturi aprobate.", 404);
  }

  if (user?.id === listing.ownerId) {
    throw new AppError("Nu poti trimite mesaj propriului anunt.", 403);
  }

  return prisma.message.create({
    data: {
      listingId,
      senderName: user.name,
      senderEmail: user.email,
      message: data.message
    }
  });
}

export async function getListingMessages(listingId, user) {
  const listing = await findListingOwnerOrThrow(listingId);

  if (user.role !== "ADMIN" && listing.ownerId !== user.id) {
    throw new AppError("Nu poti vedea mesajele acestui anunt.", 403);
  }

  return prisma.message.findMany({
    where: { listingId },
    orderBy: { createdAt: "desc" }
  });
}
