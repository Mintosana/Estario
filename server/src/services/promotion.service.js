import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { serializeListing } from "../utils/listingSerializer.js";
import { toPublicUser } from "../utils/publicUser.js";

export const promotionBundles = {
  starter: {
    credits: 3,
    label: "Starter",
    price: 25
  },
  growth: {
    credits: 8,
    label: "Growth",
    price: 60
  },
  pro: {
    credits: 20,
    label: "Pro",
    price: 125
  }
};

function addPromotionMonth(date) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

let stripeClient;

function getStripeClient() {
  if (!env.stripe.secretKey) {
    throw new AppError("Platile Stripe nu sunt configurate. Seteaza STRIPE_SECRET_KEY in backend.", 500);
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey);
  }

  return stripeClient;
}

function getBundleAmount(bundle) {
  return Math.round(bundle.price * 100);
}

function getCheckoutReturnOrigin(origin) {
  if (origin && env.clientUrls.includes(origin)) {
    return origin;
  }

  return env.clientUrl;
}

function getCheckoutReturnPath(returnPath = "/profile") {
  if (!returnPath.startsWith("/") || returnPath.startsWith("//")) {
    return "/profile";
  }

  return returnPath;
}

function buildCheckoutReturnUrl(origin, returnPath, paymentStatus) {
  const url = new URL(getCheckoutReturnPath(returnPath), origin);
  url.searchParams.set("payment", paymentStatus);
  return url.toString();
}

export function getStripeWebhookClient() {
  return getStripeClient();
}

export async function buyPromotionBundle(userId, bundleKey, options = {}) {
  const bundle = promotionBundles[bundleKey];

  if (!bundle) {
    throw new AppError("Pachetul de promovare nu este valid.", 400);
  }

  const stripe = getStripeClient();
  const amount = getBundleAmount(bundle);
  const returnOrigin = getCheckoutReturnOrigin(options.origin);
  const returnPath = getCheckoutReturnPath(options.returnPath);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: env.stripe.currency,
          product_data: {
            name: `Estario ${bundle.label}`,
            description: `${bundle.credits} credite de promovare`
          },
          unit_amount: amount
        },
        quantity: 1
      }
    ],
    metadata: {
      bundleKey,
      credits: String(bundle.credits),
      userId
    },
    success_url: buildCheckoutReturnUrl(returnOrigin, returnPath, "success"),
    cancel_url: buildCheckoutReturnUrl(returnOrigin, returnPath, "canceled")
  });

  if (!session.url) {
    throw new AppError("Stripe nu a returnat un link Checkout.", 502);
  }

  await prisma.promotionPurchase.create({
    data: {
      amount,
      bundleKey,
      credits: bundle.credits,
      currency: env.stripe.currency,
      status: "PENDING",
      stripeSessionId: session.id,
      userId
    }
  });

  return {
    url: session.url
  };
}

export async function fulfillPromotionCheckoutSession(session) {
  const stripeSessionId = session.id;
  const userId = session.metadata?.userId;
  const bundleKey = session.metadata?.bundleKey;
  const bundle = promotionBundles[bundleKey];

  if (!stripeSessionId || !userId || !bundleKey) {
    throw new AppError("Sesiunea Stripe nu contine metadatele necesare.", 400);
  }

  if (!bundle) {
    throw new AppError("Pachetul de promovare din sesiunea Stripe nu mai este valid.", 400);
  }

  const amount = session.amount_total ?? getBundleAmount(bundle);
  const currency = session.currency ?? env.stripe.currency;
  const completedAt = new Date();

  return prisma.$transaction(async (tx) => {
    const updatedPurchase = await tx.promotionPurchase.updateMany({
      where: {
        completedAt: null,
        stripeSessionId,
        userId
      },
      data: {
        amount,
        bundleKey,
        completedAt,
        credits: bundle.credits,
        currency,
        status: "COMPLETED"
      }
    });

    if (updatedPurchase.count === 0) {
      return { fulfilled: false };
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        promotionCredits: {
          increment: bundle.credits
        }
      }
    });

    return { fulfilled: true };
  });
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
