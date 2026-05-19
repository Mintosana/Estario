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
    ...(filters.currency ? { currency: filters.currency } : {}),
    ...(filters.rooms ? { rooms: filters.rooms } : {}),
    ...(filters.balcony !== undefined ? { balcony: filters.balcony } : {}),
    ...(filters.hasAirConditioning !== undefined ? { hasAirConditioning: filters.hasAirConditioning } : {}),
    ...(filters.hasElevator !== undefined ? { hasElevator: filters.hasElevator } : {}),
    ...(filters.petFriendly !== undefined ? { petFriendly: filters.petFriendly } : {}),
    ...(filters.compartmentalization ? { compartmentalization: filters.compartmentalization } : {}),
    ...(filters.parking ? { parking: filters.parking } : {}),
    ...(filters.furnished ? { furnished: filters.furnished } : {}),
    ...(filters.heatingType ? { heatingType: filters.heatingType } : {}),
    ...(filters.centralHeatingType ? { centralHeatingType: filters.centralHeatingType } : {}),
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

function normalizeText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function textEquals(first, second) {
  return normalizeText(first) === normalizeText(second);
}

function textContains(value, term) {
  return normalizeText(value).includes(normalizeText(term));
}

function priceRangeScore(listing, filters) {
  if (filters.minPrice === undefined && filters.maxPrice === undefined) {
    return 0;
  }

  const price = Number(listing.price);

  if (!Number.isFinite(price)) {
    return 0;
  }

  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    const midpoint = (filters.minPrice + filters.maxPrice) / 2;
    const range = Math.max(filters.maxPrice - filters.minPrice, 1);
    const distance = Math.min(Math.abs(price - midpoint) / range, 1);

    return 16 + Math.round((1 - distance) * 10);
  }

  if (filters.maxPrice !== undefined) {
    const distanceFromBudget = Math.max(filters.maxPrice - price, 0);
    return 12 + Math.min(Math.round((distanceFromBudget / Math.max(filters.maxPrice, 1)) * 10), 10);
  }

  const distanceFromMinimum = Math.max(price - filters.minPrice, 0);
  return 12 + Math.min(Math.round((distanceFromMinimum / Math.max(filters.minPrice, 1)) * 6), 6);
}

function completenessScore(listing) {
  const optionalFields = [
    "rooms",
    "bathrooms",
    "floor",
    "totalFloors",
    "yearBuilt",
    "balcony",
    "hasAirConditioning",
    "hasElevator",
    "petFriendly",
    "compartmentalization",
    "parking",
    "furnished",
    "heatingType",
    "buildingCondition",
    "energyClass"
  ];
  const filledFields = optionalFields.filter(
    (field) => listing[field] !== null && listing[field] !== undefined && listing[field] !== ""
  ).length;

  return Math.round((filledFields / optionalFields.length) * 12);
}

function relevanceScore(listing, filters) {
  let score = 0;

  if (filters.city) {
    score += textEquals(listing.city, filters.city) ? 32 : textContains(listing.address, filters.city) ? 18 : 0;
  }

  if (filters.county) {
    score += textEquals(listing.county, filters.county) ? 16 : 0;
  }

  if (filters.propertyType && listing.propertyType === filters.propertyType) {
    score += 18;
  }

  if (filters.transactionType && listing.transactionType === filters.transactionType) {
    score += 18;
  }

  if (filters.rooms && listing.rooms === filters.rooms) {
    score += 14;
  }

  score += priceRangeScore(listing, filters);

  if (filters.balcony !== undefined && listing.balcony === filters.balcony) {
    score += 8;
  }

  if (filters.hasAirConditioning !== undefined && listing.hasAirConditioning === filters.hasAirConditioning) {
    score += 8;
  }

  if (filters.hasElevator !== undefined && listing.hasElevator === filters.hasElevator) {
    score += 8;
  }

  if (filters.petFriendly !== undefined && listing.petFriendly === filters.petFriendly) {
    score += 8;
  }

  if (filters.compartmentalization && listing.compartmentalization === filters.compartmentalization) {
    score += 8;
  }

  if (filters.parking && listing.parking === filters.parking) {
    score += 8;
  }

  if (filters.furnished && listing.furnished === filters.furnished) {
    score += 8;
  }

  if (filters.heatingType && listing.heatingType === filters.heatingType) {
    score += 8;
  }

  if (filters.centralHeatingType && listing.centralHeatingType === filters.centralHeatingType) {
    score += 8;
  }

  if (listing.images?.length) {
    score += 10;
  }

  score += completenessScore(listing);

  return score;
}

function compareByRelevance(filters) {
  return (first, second) => {
    const scoreDifference = relevanceScore(second, filters) - relevanceScore(first, filters);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
  };
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

  if (filters.sort === "relevance") {
    const [total, listings] = await prisma.$transaction([
      prisma.listing.count({ where }),
      prisma.listing.findMany({
        where,
        include: publicListingInclude
      })
    ]);
    const sortedListings = listings.sort(compareByRelevance(filters)).slice(skip, skip + filters.limit);

    return {
      data: serializeListings(sortedListings),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit)
      }
    };
  }

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

  const shouldPreserveStatus = user.role === "ADMIN" && listing.ownerId !== user.id;

  const updatedListing = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      ...(shouldPreserveStatus ? {} : { status: "PENDING", rejectionReason: null })
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

  return getListingById(id, user);
}

export async function reorderListingImages(id, user, imageIds) {
  const listing = await findListingOrThrow(id);

  if (!canManageListing(listing, user)) {
    throw new AppError("Nu poti ordona imaginile acestui anunt.", 403);
  }

  const currentImageIds = listing.images.map((image) => image.id);
  const currentImageIdSet = new Set(currentImageIds);
  const requestedImageIdSet = new Set(imageIds);

  if (requestedImageIdSet.size !== imageIds.length) {
    throw new AppError("Lista de imagini contine duplicate.", 400);
  }

  if (
    imageIds.length !== currentImageIds.length ||
    imageIds.some((imageId) => !currentImageIdSet.has(imageId))
  ) {
    throw new AppError("Lista de imagini nu corespunde anuntului.", 400);
  }

  await prisma.$transaction(
    imageIds.map((imageId, position) =>
      prisma.listingImage.update({
        where: { id: imageId },
        data: { position }
      })
    )
  );

  return getListingById(id, user);
}
