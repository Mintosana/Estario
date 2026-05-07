import { prisma } from "../config/prisma.js";
import { publicListingInclude } from "../constants/listingConstants.js";
import { AppError } from "../utils/AppError.js";
import { serializeListing, serializeListings } from "../utils/listingSerializer.js";

function moderationWhere(status) {
  return { status };
}

export async function getPendingListings() {
  const listings = await prisma.listing.findMany({
    where: moderationWhere("PENDING"),
    include: publicListingInclude,
    orderBy: { createdAt: "asc" }
  });

  return serializeListings(listings);
}

export async function getRejectedListings() {
  const listings = await prisma.listing.findMany({
    where: moderationWhere("REJECTED"),
    include: publicListingInclude,
    orderBy: { updatedAt: "desc" }
  });

  return serializeListings(listings);
}

export async function approveListing(id) {
  const listing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  if (listing.status !== "PENDING") {
    throw new AppError("Doar anunturile in asteptare pot fi aprobate.", 400);
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: {
      status: "APPROVED",
      rejectionReason: null
    },
    include: publicListingInclude
  });

  return serializeListing(updatedListing);
}

export async function rejectListing(id, reason) {
  const listing = await prisma.listing.findUnique({
    where: { id }
  });

  if (!listing) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  if (listing.status !== "PENDING") {
    throw new AppError("Doar anunturile in asteptare pot fi respinse.", 400);
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: {
      status: "REJECTED",
      rejectionReason: reason
    },
    include: publicListingInclude
  });

  return serializeListing(updatedListing);
}
