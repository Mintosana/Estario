function decimalToNumber(value) {
  return value === null || value === undefined ? value : Number(value);
}

export function serializeListing(listing) {
  if (!listing) {
    return listing;
  }

  return {
    ...listing,
    price: decimalToNumber(listing.price),
    latitude: decimalToNumber(listing.latitude),
    longitude: decimalToNumber(listing.longitude)
  };
}

export function serializeListings(listings) {
  return listings.map(serializeListing);
}
