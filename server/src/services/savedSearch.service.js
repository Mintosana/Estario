import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

function decimalToNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}

function serializeSavedSearch(savedSearch) {
  return {
    ...savedSearch,
    minPrice: decimalToNumber(savedSearch.minPrice),
    maxPrice: decimalToNumber(savedSearch.maxPrice)
  };
}

function normalizeSavedSearchData(data) {
  return {
    ...data,
    city: data.city || null,
    county: data.county || null,
    propertyType: data.propertyType || null,
    transactionType: data.transactionType || null,
    currency: data.currency || null,
    minPrice: data.minPrice ?? null,
    maxPrice: data.maxPrice ?? null,
    rooms: data.rooms ?? null,
    balcony: data.balcony ?? null,
    hasAirConditioning: data.hasAirConditioning ?? null,
    hasElevator: data.hasElevator ?? null,
    petFriendly: data.petFriendly ?? null,
    compartmentalization: data.compartmentalization || null,
    parking: data.parking || null,
    furnished: data.furnished || null,
    heatingType: data.heatingType || null,
    centralHeatingType: data.centralHeatingType || null,
    sort: data.sort || "relevance"
  };
}

function normalizeSavedSearchUpdateData(data) {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => {
      if (["city", "county", "propertyType", "transactionType", "currency", "compartmentalization", "parking", "furnished", "heatingType", "centralHeatingType"].includes(key)) {
        return [key, value || null];
      }

      if (["minPrice", "maxPrice", "rooms", "balcony", "hasAirConditioning", "hasElevator", "petFriendly"].includes(key)) {
        return [key, value ?? null];
      }

      if (key === "sort") {
        return [key, value || "relevance"];
      }

      return [key, value];
    })
  );
}

async function findOwnedSavedSearchOrThrow(id, userId) {
  const savedSearch = await prisma.savedSearch.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!savedSearch) {
    throw new AppError("Cautarea salvata nu a fost gasita.", 404);
  }

  return savedSearch;
}

export async function getSavedSearches(userId) {
  const savedSearches = await prisma.savedSearch.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" }
  });

  return savedSearches.map(serializeSavedSearch);
}

export async function createSavedSearch(userId, data) {
  const savedSearch = await prisma.savedSearch.create({
    data: {
      ...normalizeSavedSearchData(data),
      userId
    }
  });

  return serializeSavedSearch(savedSearch);
}

export async function updateSavedSearch(id, userId, data) {
  await findOwnedSavedSearchOrThrow(id, userId);

  const savedSearch = await prisma.savedSearch.update({
    where: { id },
    data: normalizeSavedSearchUpdateData(data)
  });

  return serializeSavedSearch(savedSearch);
}

export async function deleteSavedSearch(id, userId) {
  await findOwnedSavedSearchOrThrow(id, userId);

  await prisma.savedSearch.delete({
    where: { id }
  });
}
