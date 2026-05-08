export function formatPrice(price, currency = "EUR") {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(price);
}

export function formatArea(surface) {
  return `${surface} mp`;
}

export function formatPricePerSquareMeter(price, surface, currency = "EUR") {
  const numericPrice = Number(price);
  const numericSurface = Number(surface);

  if (!Number.isFinite(numericPrice) || !Number.isFinite(numericSurface) || numericSurface <= 0) {
    return "-";
  }

  return `${new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(numericPrice / numericSurface)}/mp`;
}

export function formatDistance(meters) {
  const numericMeters = Number(meters);

  if (!Number.isFinite(numericMeters)) {
    return "-";
  }

  if (numericMeters < 1000) {
    return `${Math.round(numericMeters)} m`;
  }

  return `${(numericMeters / 1000).toLocaleString("ro-RO", {
    maximumFractionDigits: 1
  })} km`;
}
