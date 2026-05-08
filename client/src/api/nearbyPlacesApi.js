const overpassEndpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

const nearbyCategories = {
  metro: {
    label: "Metrou",
    fallbackName: "Statie metrou"
  },
  stb: {
    label: "STB",
    fallbackName: "Statie STB"
  },
  shop: {
    label: "Magazin",
    fallbackName: "Magazin"
  },
  school: {
    label: "Scoala",
    fallbackName: "Scoala"
  },
  hospital: {
    label: "Spital",
    fallbackName: "Unitate medicala"
  }
};

function buildNearbyQuery(latitude, longitude, radiusMeters) {
  const around = `(around:${radiusMeters},${latitude},${longitude})`;

  return `
    [out:json][timeout:12];
    (
      node${around}["railway"="subway_entrance"];
      node${around}["station"="subway"];
      node${around}["railway"="station"]["station"="subway"];
      way${around}["railway"="station"]["station"="subway"];
      node${around}["highway"="bus_stop"];
      node${around}["railway"="tram_stop"];
      node${around}["public_transport"="platform"]["bus"="yes"];
      node${around}["public_transport"="platform"]["trolleybus"="yes"];
      node${around}["public_transport"="platform"]["tram"="yes"];
      node${around}["shop"~"^(supermarket|convenience|greengrocer)$"];
      way${around}["shop"~"^(supermarket|convenience|greengrocer)$"];
      node${around}["amenity"~"^(school|kindergarten|university)$"];
      way${around}["amenity"~"^(school|kindergarten|university)$"];
      node${around}["amenity"~"^(hospital|clinic|doctors)$"];
      way${around}["amenity"~"^(hospital|clinic|doctors)$"];
    );
    out center 160;
  `;
}

function categoryForTags(tags = {}) {
  if (tags.railway === "subway_entrance" || tags.station === "subway") {
    return "metro";
  }

  if (
    tags.highway === "bus_stop" ||
    tags.railway === "tram_stop" ||
    tags.bus === "yes" ||
    tags.trolleybus === "yes" ||
    tags.tram === "yes"
  ) {
    return "stb";
  }

  if (["supermarket", "convenience", "greengrocer"].includes(tags.shop)) {
    return "shop";
  }

  if (["school", "kindergarten", "university"].includes(tags.amenity)) {
    return "school";
  }

  if (["hospital", "clinic", "doctors"].includes(tags.amenity)) {
    return "hospital";
  }

  return null;
}

function distanceInMeters(first, second) {
  const earthRadius = 6371000;
  const firstLat = (first.latitude * Math.PI) / 180;
  const secondLat = (second.latitude * Math.PI) / 180;
  const deltaLat = ((second.latitude - first.latitude) * Math.PI) / 180;
  const deltaLng = ((second.longitude - first.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveElementLocation(element) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function normalizePlace(element, listingLocation) {
  const location = resolveElementLocation(element);
  const category = categoryForTags(element.tags);

  if (!location || !category) {
    return null;
  }

  return {
    category,
    distance: distanceInMeters(listingLocation, location),
    id: `${element.type}:${element.id}`,
    name: element.tags?.name || nearbyCategories[category].fallbackName
  };
}

function nearestByCategory(elements, listingLocation) {
  const nearest = new Map();

  elements
    .map((element) => normalizePlace(element, listingLocation))
    .filter(Boolean)
    .forEach((place) => {
      const current = nearest.get(place.category);

      if (!current || place.distance < current.distance) {
        nearest.set(place.category, place);
      }
    });

  return Object.entries(nearbyCategories).map(([category, config]) => ({
    category,
    label: config.label,
    place: nearest.get(category) ?? null
  }));
}

export async function getNearbyPlaces(latitude, longitude, signal) {
  const listingLocation = { latitude, longitude };
  const query = buildNearbyQuery(latitude, longitude, 1800);
  let lastError = null;

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=UTF-8"
        },
        body: query,
        signal
      });

      if (!response.ok) {
        lastError = new Error("overpass_failed");

        if (response.status === 429) {
          continue;
        }

        continue;
      }

      const payload = await response.json();
      return nearestByCategory(payload.elements ?? [], listingLocation);
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError ?? new Error("overpass_failed");
}
