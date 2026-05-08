import { prisma } from "../config/prisma.js";

function serializePoi(poi) {
  return {
    id: poi.id,
    name: poi.name,
    category: poi.category,
    city: poi.city,
    county: poi.county,
    latitude: Number(poi.latitude),
    longitude: Number(poi.longitude)
  };
}

export async function getPointsOfInterest(filters) {
  const pois = await prisma.pointOfInterest.findMany({
    where: {
      category: {
        in: filters.categories
      },
      latitude: {
        gte: filters.south,
        lte: filters.north
      },
      longitude: {
        gte: filters.west,
        lte: filters.east
      }
    },
    orderBy: [
      { category: "asc" },
      { name: "asc" }
    ]
  });

  return pois.map(serializePoi);
}
