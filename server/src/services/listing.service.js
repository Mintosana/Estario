import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../config/prisma.js";
import { publicListingInclude } from "../constants/listingConstants.js";
import { AppError } from "../utils/AppError.js";
import { createUploadUrl } from "../utils/fileUrl.js";
import { serializeListing, serializeListings } from "../utils/listingSerializer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "..", "uploads");

function canManageListing(listing, user) {
  return user?.role === "ADMIN" || listing.ownerId === user?.id;
}

function sectorWhereFromCity(city) {
  const sectorAddressTerms = {
    "Sector 1": ["Sector 1", "Nicolae Caramfil", "Aviatorilor", "Alexandru Serbanescu", "Pipera", "Floreasca", "Bucurestii Noi", "Privighetorilor", "Dorobanti"],
    "Sector 2": ["Sector 2", "Colentina", "Pantelimon", "Dacia", "Mosilor"],
    "Sector 3": ["Sector 3", "Decebal", "Liviu Rebreanu", "1 Decembrie 1918", "Unirii"],
    "Sector 4": ["Sector 4", "Tineretului", "Cutitul de Argint"],
    "Sector 5": ["Sector 5", "Rahovei", "Louis Pasteur"],
    "Sector 6": ["Sector 6", "Drumul Taberei", "Brasov", "Iuliu Maniu"]
  };

  const addressTerms = sectorAddressTerms[city];

  if (!addressTerms) {
    return null;
  }

  return {
    city: { equals: "Bucuresti", mode: "insensitive" },
    OR: addressTerms.map((term) => ({
      address: { contains: term, mode: "insensitive" }
    }))
  };
}

function publicWhereFromFilters(filters) {
  const sectorWhere = filters.city ? sectorWhereFromCity(filters.city) : null;

  return {
    status: "APPROVED",
    ...(sectorWhere ? sectorWhere : filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {}),
    ...(filters.county ? { county: { contains: filters.county, mode: "insensitive" } } : {}),
    ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
    ...(filters.transactionType ? { transactionType: filters.transactionType } : {}),
    ...(filters.rooms ? { rooms: filters.rooms } : {}),
    ...(filters.balcony !== undefined ? { balcony: filters.balcony } : {}),
    ...(filters.parking ? { parking: filters.parking } : {}),
    ...(filters.furnished ? { furnished: filters.furnished } : {}),
    ...(filters.hasOwnCentralHeating !== undefined ? { hasOwnCentralHeating: filters.hasOwnCentralHeating } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
      ? {
          price: {
            ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
            ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {})
          }
        }
      : {})
  };
}

function orderByFromSort(sort) {
  if (sort === "price_asc") {
    return { price: "asc" };
  }

  if (sort === "price_desc") {
    return { price: "desc" };
  }

  return { createdAt: "desc" };
}

async function findListingOrThrow(id) {
  const listing = await prisma.listing.findUnique({
    where: { id },
    include: publicListingInclude
  });

  if (!listing) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  return listing;
}

async function removeLocalImageFiles(images) {
  await Promise.all(
    images
      .filter((image) => image.url.startsWith("/uploads/"))
      .filter((image) => !path.basename(image.url).startsWith("demo-"))
      .map((image) => fs.rm(path.join(uploadsDir, path.basename(image.url)), { force: true }))
  );
}

export async function getPublicListings(filters) {
  const where = publicWhereFromFilters(filters);
  const skip = (filters.page - 1) * filters.limit;

  const [total, listings] = await prisma.$transaction([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      include: publicListingInclude,
      orderBy: orderByFromSort(filters.sort),
      skip,
      take: filters.limit
    })
  ]);

  return {
    data: serializeListings(listings),
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total,
      totalPages: Math.ceil(total / filters.limit)
    }
  };
}

export async function getListingById(id, user) {
  const listing = await findListingOrThrow(id);

  if (listing.status !== "APPROVED" && !canManageListing(listing, user)) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  if (listing.status === "APPROVED" && !canManageListing(listing, user)) {
    await prisma.listing.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1
        }
      }
    });
    listing.viewCount += 1;
  }

  return serializeListing(listing);
}

export async function getMyListings(userId) {
  const listings = await prisma.listing.findMany({
    where: { ownerId: userId },
    include: publicListingInclude,
    orderBy: { createdAt: "desc" }
  });

  return serializeListings(listings);
}

export async function getMyListingAnalytics(userId) {
  const listings = await prisma.listing.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      status: true,
      viewCount: true,
      _count: {
        select: {
          favorites: true,
          conversations: true,
          messages: true
        }
      }
    }
  });

  const totals = listings.reduce(
    (current, listing) => {
      current.totalListings += 1;
      current.totalViews += listing.viewCount;
      current.totalFavorites += listing._count.favorites;
      current.totalConversations += listing._count.conversations;
      current.totalMessages += listing._count.messages;
      current.statusCounts[listing.status] = (current.statusCounts[listing.status] ?? 0) + 1;
      return current;
    },
    {
      statusCounts: {
        APPROVED: 0,
        PENDING: 0,
        REJECTED: 0
      },
      totalConversations: 0,
      totalFavorites: 0,
      totalListings: 0,
      totalMessages: 0,
      totalViews: 0
    }
  );

  return {
    ...totals,
    contactRate: totals.totalViews > 0 ? Number(((totals.totalConversations / totals.totalViews) * 100).toFixed(1)) : 0
  };
}

export async function createListing(userId, data) {
  const listing = await prisma.listing.create({
    data: {
      ...data,
      ownerId: userId,
      status: "PENDING"
    },
    include: publicListingInclude
  });

  return serializeListing(listing);
}

export async function updateListing(id, user, data) {
  const listing = await findListingOrThrow(id);

  if (!canManageListing(listing, user)) {
    throw new AppError("Nu poti modifica acest anunt.", 403);
  }

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      ...(user.role === "ADMIN" ? {} : { status: "PENDING", rejectionReason: null })
    },
    include: publicListingInclude
  });

  return serializeListing(updatedListing);
}

export async function deleteListing(id, user) {
  const listing = await findListingOrThrow(id);

  if (!canManageListing(listing, user)) {
    throw new AppError("Nu poti sterge acest anunt.", 403);
  }

  await prisma.listing.delete({
    where: { id }
  });

  await removeLocalImageFiles(listing.images);
}

export async function addListingImages(id, user, files) {
  const listing = await findListingOrThrow(id);

  if (!canManageListing(listing, user)) {
    throw new AppError("Nu poti incarca imagini pentru acest anunt.", 403);
  }

  if (!files?.length) {
    throw new AppError("Selecteaza cel putin o imagine.", 400);
  }

  const lastImage = await prisma.listingImage.findFirst({
    where: { listingId: id },
    orderBy: { position: "desc" }
  });
  const startPosition = lastImage ? lastImage.position + 1 : 0;

  await prisma.listingImage.createMany({
    data: files.map((file, index) => ({
      listingId: id,
      url: createUploadUrl(file.filename),
      position: startPosition + index
    }))
  });

  return getListingById(id, user);
}

export async function removeListingImage(id, imageId, user) {
  const listing = await findListingOrThrow(id);

  if (!canManageListing(listing, user)) {
    throw new AppError("Nu poti sterge imagini pentru acest anunt.", 403);
  }

  const image = await prisma.listingImage.findFirst({
    where: {
      id: imageId,
      listingId: id
    }
  });

  if (!image) {
    throw new AppError("Imaginea nu a fost gasita.", 404);
  }

  await prisma.listingImage.delete({
    where: { id: imageId }
  });

  await removeLocalImageFiles([image]);
}
