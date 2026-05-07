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
