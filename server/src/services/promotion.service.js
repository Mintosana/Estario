import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { serializeListing } from "../utils/listingSerializer.js";
import { toPublicUser } from "../utils/publicUser.js";

export const promotionBundles = {
  starter: {
    credits: 3,
    label: "Starter",
    price: 5
  },
  growth: {
    credits: 8,
    label: "Growth",
    price: 12
  },
  pro: {
    credits: 20,
    label: "Pro",
    price: 25
  }
};

function addPromotionMonth(date) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

export async function buyPromotionBundle(userId, bundleKey) {
  const bundle = promotionBundles[bundleKey];

  if (!bundle) {
    throw new AppError("Pachetul de promovare nu este valid.", 400);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      promotionCredits: {
        increment: bundle.credits
      }
    }
  });

  return {
    bundle,
    user: toPublicUser(user)
  };
}

export async function sponsorListing(listingId, userId) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    include: {
      images: {
        orderBy: {
          position: "asc"
        }
      },
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          phone: true,
          bio: true,
          createdAt: true
        }
      }
    }
  });

  if (!listing || listing.ownerId !== userId) {
    throw new AppError("Anuntul nu a fost gasit.", 404);
  }

  if (listing.status !== "APPROVED") {
    throw new AppError("Poti sponsoriza doar anunturi aprobate.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user || user.promotionCredits <= 0) {
    throw new AppError("Nu ai credite de promovare disponibile.", 400);
  }

  const now = new Date();
  const isExtendingActivePromotion = listing.sponsoredUntil && listing.sponsoredUntil > now;
  const currentEnd = isExtendingActivePromotion ? listing.sponsoredUntil : now;
  const sponsoredUntil = addPromotionMonth(currentEnd);
  const previousViewEstimate = Math.max(
    0,
    Math.min(listing.viewCount, Math.round(listing.viewCount * 0.65))
  );

  const [updatedUser, updatedListing] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        promotionCredits: {
          decrement: 1
        }
      }
    }),
    prisma.listing.update({
      where: { id: listingId },
      data: {
        sponsoredAt: now,
        sponsoredUntil,
        sponsoredPreviousViewEstimate: isExtendingActivePromotion
          ? listing.sponsoredPreviousViewEstimate
          : previousViewEstimate,
        sponsoredViewBaseline: isExtendingActivePromotion ? listing.sponsoredViewBaseline : listing.viewCount
      },
      include: {
        images: {
          orderBy: {
            position: "asc"
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            phone: true,
            bio: true,
            createdAt: true
          }
        }
      }
    })
  ]);

  return {
    listing: serializeListing(updatedListing),
    user: toPublicUser(updatedUser)
  };
}
