import { prisma } from "../src/config/prisma.js";

const bucharestBounds = {
  south: 44.33,
  west: 25.94,
  north: 44.56,
  east: 26.24
};

const overpassEndpoints = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter"
];

function bbox() {
  return [
    bucharestBounds.south,
    bucharestBounds.west,
    bucharestBounds.north,
    bucharestBounds.east
  ].join(",");
}

function buildQuery() {
  const box = bbox();

  return `
    [out:json][timeout:35];
    (
      node["station"="subway"](${box});
      node["railway"="station"]["station"="subway"](${box});
      way["station"="subway"](${box});
      way["railway"="station"]["station"="subway"](${box});
      relation["station"="subway"](${box});
      relation["railway"="station"]["station"="subway"](${box});

      node["highway"="bus_stop"](${box});
      node["public_transport"="platform"]["bus"="yes"](${box});
      node["public_transport"="platform"]["trolleybus"="yes"](${box});
      node["public_transport"="platform"]["tram"="yes"](${box});
      node["railway"="tram_stop"](${box});
    );
    out center;
  `;
}

function categoryForTags(tags = {}) {
  if (tags.station === "subway" || (tags.railway === "station" && tags.station === "subway")) {
    return "metro";
  }

  if (tags.trolleybus === "yes") {
    return "trolley";
  }

  if (tags.tram === "yes" || tags.railway === "tram_stop") {
    return "tram";
  }

  if (tags.bus === "yes" || tags.highway === "bus_stop") {
    return "bus";
  }

  return null;
}

function fallbackName(category) {
  if (category === "metro") {
    return "Statie metrou";
  }

  if (category === "tram") {
    return "Statie tramvai";
  }

  if (category === "trolley") {
    return "Statie troleibuz";
  }

  return "Statie STB";
}

function normalizeName(name, category) {
  if (!name) {
    return fallbackName(category);
  }

  if (category === "metro" && !/^metrou/i.test(name)) {
    return `Metrou ${name}`;
  }

  if (category !== "metro" && !/^stb/i.test(name)) {
    return `STB ${name}`;
  }

  return name;
}

function locationForElement(element) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}

function dedupeKey(poi) {
  return [
    poi.category,
    poi.name.toLowerCase().replace(/\s+/g, " ").trim(),
    poi.latitude.toFixed(4),
    poi.longitude.toFixed(4)
  ].join("|");
}

async function fetchOverpassPois() {
  let lastError = null;

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Estario local POI importer"
        },
        body: new URLSearchParams({ data: buildQuery() })
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastError = new Error(`Overpass returned ${response.status}: ${errorText.slice(0, 500)}`);
        continue;
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("Overpass request failed");
}

async function main() {
  const payload = await fetchOverpassPois();
  const uniquePois = new Map();

  for (const element of payload.elements ?? []) {
    const category = categoryForTags(element.tags);
    const location = locationForElement(element);

    if (!category || !location) {
      continue;
    }

    const poi = {
      name: normalizeName(element.tags?.name, category),
      category,
      city: "Bucuresti",
      county: "Bucuresti",
      latitude: location.latitude,
      longitude: location.longitude
    };

    uniquePois.set(dedupeKey(poi), poi);
  }

  const pois = Array.from(uniquePois.values());

  await prisma.$transaction([
    prisma.pointOfInterest.deleteMany({
      where: {
        city: "Bucuresti",
        category: {
          in: ["metro", "bus", "trolley", "tram"]
        }
      }
    }),
    prisma.pointOfInterest.createMany({
      data: pois
    })
  ]);

  const counts = pois.reduce((current, poi) => {
    current[poi.category] = (current[poi.category] ?? 0) + 1;
    return current;
  }, {});

  console.log(JSON.stringify({ imported: pois.length, counts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
