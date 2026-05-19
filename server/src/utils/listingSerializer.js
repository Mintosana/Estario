function decimalToNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}

function isActiveSponsorship(listing) {
  return listing.sponsoredUntil ? new Date(listing.sponsoredUntil).getTime() > Date.now() : false;
}

function deterministicNumber(seed, min, max) {
  const text = String(seed ?? "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }

  return min + (hash % (max - min + 1));
}

function buildPromotionAnalytics(listing) {
  if (!listing.sponsoredAt || !listing.sponsoredUntil) {
    return null;
  }

  const now = Date.now();
  const startedAt = new Date(listing.sponsoredAt);
  const endsAt = new Date(listing.sponsoredUntil);
  const totalPromotionMs = Math.max(1, endsAt.getTime() - startedAt.getTime());
  const elapsedMs = Math.max(0, Math.min(now, endsAt.getTime()) - startedAt.getTime());
  const elapsedRatio = Math.max(0.15, Math.min(1, elapsedMs / totalPromotionMs));
  const baseline = listing.sponsoredViewBaseline;
  const trackedViews = baseline === null || baseline === undefined ? null : Math.max(0, listing.viewCount - baseline);
  const estimatedViews = Math.ceil(deterministicNumber(`${listing.id}:during`, 8, 34) * elapsedRatio);
  const previousViews =
    listing.sponsoredPreviousViewEstimate ?? deterministicNumber(`${listing.id}:previous`, 3, 24);
  const viewsDuringPromotion = Math.max(trackedViews ?? 0, estimatedViews);
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now) / (1000 * 60 * 60 * 24)));

  return {
    daysRemaining,
    endsAt,
    isEstimated: trackedViews === null || trackedViews < estimatedViews,
    previousPeriodViews: previousViews,
    startedAt,
    viewsDuringPromotion,
    viewsDelta: viewsDuringPromotion - previousViews
  };
}

export function serializeListing(listing) {
  if (!listing) {
    return listing;
  }

  return {
    ...listing,
    isSponsored: isActiveSponsorship(listing),
    promotionAnalytics: buildPromotionAnalytics(listing),
    price: decimalToNumber(listing.price),
    latitude: decimalToNumber(listing.latitude),
    longitude: decimalToNumber(listing.longitude)
  };
}

export function serializeListings(listings) {
  return listings.map(serializeListing);
}
