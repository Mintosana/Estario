import { prisma } from "../config/prisma.js";
import { publicListingInclude } from "../constants/listingConstants.js";
import { AppError } from "../utils/AppError.js";
import { serializeListing, serializeListings } from "../utils/listingSerializer.js";
import { createNotification } from "./notification.service.js";

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

function groupRowsToObject(rows, keyField) {
  return rows.reduce((current, row) => {
    current[row[keyField]] = row._count._all;
    return current;
  }, {});
}

function addMonths(date, amount) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1));
}

function addDays(date, amount) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount));
}

function dayStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function monthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function monthKey(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayLabel(date) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC"
  })
    .format(date)
    .replace(".", "");
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  })
    .format(date)
    .replace(".", "");
}

function emptyActivityBucket(key, label) {
  return {
    favorites: 0,
    key,
    label,
    listings: 0,
    messages: 0,
    users: 0
  };
}

function populateActivityBuckets(buckets, recordsByMetric, keyForDate) {
  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  Object.entries(recordsByMetric).forEach(([metric, records]) => {
    records.forEach((record) => {
      const bucket = bucketMap.get(keyForDate(record.createdAt));
      if (bucket) {
        bucket[metric] += 1;
      }
    });
  });

  return buckets;
}

function buildDailyActivity(recordsByMetric, dayCount = 14) {
  const firstDay = addDays(dayStart(new Date()), -(dayCount - 1));
  const buckets = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(firstDay, index);
    return emptyActivityBucket(dayKey(date), dayLabel(date));
  });

  return populateActivityBuckets(buckets, recordsByMetric, dayKey);
}

function buildMonthlyActivity(recordsByMetric, monthCount = 3) {
  const firstMonth = addMonths(monthStart(new Date()), -(monthCount - 1));
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = addMonths(firstMonth, index);
    return emptyActivityBucket(monthKey(date), monthLabel(date));
  });

  return populateActivityBuckets(buckets, recordsByMetric, monthKey);
}

export async function getAdminAnalytics() {
  const dailyActivityStart = addDays(dayStart(new Date()), -13);
  const monthlyActivityStart = addMonths(monthStart(new Date()), -2);
  const activityStart = dailyActivityStart < monthlyActivityStart ? dailyActivityStart : monthlyActivityStart;
  const [
    totalUsers,
    totalListings,
    totalFavorites,
    totalMessages,
    totalConversations,
    totalViews,
    listingsByStatus,
    listingsByCity,
    listingsByPropertyType,
    listingsByTransactionType,
    usersForActivity,
    listingsForActivity,
    messagesForActivity,
    favoritesForActivity
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.favorite.count(),
    prisma.message.count(),
    prisma.conversation.count(),
    prisma.listing.aggregate({ _sum: { viewCount: true } }),
    prisma.listing.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["city"], _count: { _all: true }, orderBy: { _count: { city: "desc" } }, take: 8 }),
    prisma.listing.groupBy({ by: ["propertyType"], _count: { _all: true } }),
    prisma.listing.groupBy({ by: ["transactionType"], _count: { _all: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } }),
    prisma.listing.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } }),
    prisma.message.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } }),
    prisma.favorite.findMany({ where: { createdAt: { gte: activityStart } }, select: { createdAt: true } })
  ]);
  const activityRecords = {
    favorites: favoritesForActivity,
    listings: listingsForActivity,
    messages: messagesForActivity,
    users: usersForActivity
  };

  return {
    activityByDay: buildDailyActivity(activityRecords),
    activityByMonth: buildMonthlyActivity(activityRecords),
    listingsByCity: groupRowsToObject(listingsByCity, "city"),
    listingsByPropertyType: groupRowsToObject(listingsByPropertyType, "propertyType"),
    listingsByStatus: {
      APPROVED: 0,
      PENDING: 0,
      REJECTED: 0,
      ...groupRowsToObject(listingsByStatus, "status")
    },
    listingsByTransactionType: groupRowsToObject(listingsByTransactionType, "transactionType"),
    totalConversations,
    totalFavorites,
    totalListings,
    totalMessages,
    totalUsers,
    totalViews: totalViews._sum.viewCount ?? 0
  };
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

  await createNotification({
    body: "Anuntul tau este acum vizibil public in marketplace.",
    targetUrl: `/listings/${updatedListing.id}`,
    title: `Anunt aprobat: ${updatedListing.title}`,
    type: "LISTING_APPROVED",
    userId: updatedListing.ownerId
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

  await createNotification({
    body: reason,
    targetUrl: `/listings/${updatedListing.id}/edit`,
    title: `Anunt respins: ${updatedListing.title}`,
    type: "LISTING_REJECTED",
    userId: updatedListing.ownerId
  });

  return serializeListing(updatedListing);
}
