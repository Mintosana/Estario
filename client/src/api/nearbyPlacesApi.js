import { axiosClient } from "./axiosClient.js";

const nearbyCategories = {
  metro: {
    label: "Metrou"
  },
  stb: {
    label: "STB"
  },
  shop: {
    label: "Magazin"
  },
  school: {
    label: "Scoala"
  },
  hospital: {
    label: "Spital"
  }
};

const poiCategoryMap = {
  bus: "stb",
  education: "school",
  groceries: "shop",
  healthcare: "hospital",
  metro: "metro",
  tram: "stb",
  trolley: "stb"
};

const backendCategories = ["metro", "bus", "trolley", "tram", "groceries", "education", "healthcare"];

function boundsAround(latitude, longitude, radiusMeters) {
  const latitudeDelta = radiusMeters / 111320;
  const longitudeDelta = radiusMeters / (111320 * Math.cos((latitude * Math.PI) / 180));

  return {
    east: longitude + longitudeDelta,
    north: latitude + latitudeDelta,
    south: latitude - latitudeDelta,
    west: longitude - longitudeDelta
  };
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

function nearestByCategory(points, listingLocation) {
  const nearest = new Map();

  points.forEach((point) => {
    const category = poiCategoryMap[point.category];

    if (!category) {
      return;
    }

    const place = {
      category,
      distance: distanceInMeters(listingLocation, {
        latitude: point.latitude,
        longitude: point.longitude
      }),
      id: point.id,
      name: point.name
    };
    const current = nearest.get(category);

    if (!current || place.distance < current.distance) {
      nearest.set(category, place);
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
  const response = await axiosClient.get("/points-of-interest", {
    params: {
      ...boundsAround(latitude, longitude, 1800),
      categories: backendCategories.join(",")
    },
    signal
  });

  return nearestByCategory(response.data.data ?? [], listingLocation);
}
