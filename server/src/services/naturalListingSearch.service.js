import {
  furnishingStatuses,
  listingSortOptions,
  parkingTypes,
  propertyTypes,
  transactionTypes
} from "../constants/listingConstants.js";
import { countyOptions, romanianLocations } from "../constants/romaniaLocations.js";
import { env } from "../config/env.js";

const propertyKeywords = [
  { value: "APARTMENT", words: ["apartament", "apartment", "apartamente"] },
  { value: "HOUSE", words: ["casa", "case", "vila", "villa"] },
  { value: "STUDIO", words: ["garsoniera", "studio"] },
  { value: "LAND", words: ["teren", "lot"] }
];

const numberWords = {
  o: 1,
  una: 1,
  un: 1,
  doua: 2,
  doi: 2,
  trei: 3,
  patru: 4,
  cinci: 5,
  sase: 6
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function emptyFilters() {
  return {
    city: null,
    county: null,
    maxPrice: null,
    minPrice: null,
    propertyType: null,
    rooms: null,
    balcony: null,
    parking: null,
    furnished: null,
    hasOwnCentralHeating: null,
    sort: "newest",
    transactionType: null
  };
}

function parseAmount(rawAmount, suffix = "") {
  const normalized = rawAmount.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.round(number * (/k|mii|mie/.test(suffix) ? 1000 : 1));
}

function findLocation(normalizedQuery) {
  for (const [county, cities] of Object.entries(romanianLocations)) {
    const normalizedCounty = normalizeText(county);

    for (const city of cities) {
      if (normalizedQuery.includes(normalizeText(city))) {
        return { city, county };
      }
    }

    if (normalizedQuery.includes(normalizedCounty)) {
      return { city: null, county };
    }
  }

  return { city: null, county: null };
}

function parseWithRules(query) {
  const normalizedQuery = normalizeText(query);
  const filters = emptyFilters();
  const location = findLocation(normalizedQuery);

  filters.city = location.city;
  filters.county = location.county;

  if (/(inchir|chirie|rent)/.test(normalizedQuery)) {
    filters.transactionType = "RENT";
  } else if (/(vanz|cumpar|achiz)/.test(normalizedQuery)) {
    filters.transactionType = "SALE";
  }

  const propertyMatch = propertyKeywords.find((option) =>
    option.words.some((word) => normalizedQuery.includes(word))
  );
  if (propertyMatch) {
    filters.propertyType = propertyMatch.value;
  }

  const numericRoomsMatch = normalizedQuery.match(/(\d+)\s*(camere|camera|cam)/);
  const wordRoomsMatch = Object.entries(numberWords).find(([word]) =>
    new RegExp(`\\b${word}\\s+(camere|camera|cam)\\b`).test(normalizedQuery)
  );
  const rooms = numericRoomsMatch ? Number(numericRoomsMatch[1]) : wordRoomsMatch ? wordRoomsMatch[1] : null;
  if (rooms) {
    filters.rooms = Number(rooms);
  }

  const maxPriceMatch = normalizedQuery.match(
    /(sub|pana la|maxim|maximum|buget de|buget)\s+(\d+(?:[.,]\d+)?)\s*(k|mii|mie)?/
  );
  const minPriceMatch = normalizedQuery.match(/(peste|minim|minimum|de la)\s+(\d+(?:[.,]\d+)?)\s*(k|mii|mie)?/);

  if (maxPriceMatch) {
    filters.maxPrice = parseAmount(maxPriceMatch[2], maxPriceMatch[3]);
  }

  if (minPriceMatch) {
    filters.minPrice = parseAmount(minPriceMatch[2], minPriceMatch[3]);
  }

  if (/(ieftin|ieftine|pret mic|cele mai ieftine)/.test(normalizedQuery)) {
    filters.sort = "price_asc";
  } else if (/(scump|lux|premium|pret mare)/.test(normalizedQuery)) {
    filters.sort = "price_desc";
  }

  if (/(mobilat complet|complet mobilat|mobilata complet)/.test(normalizedQuery)) {
    filters.furnished = "FURNISHED";
  } else if (/(partial mobilat|semimobilat|semi mobilat)/.test(normalizedQuery)) {
    filters.furnished = "PARTIAL";
  } else if (/(nemobilat|nemobilata|fara mobila)/.test(normalizedQuery)) {
    filters.furnished = "UNFURNISHED";
  }

  if (/(garaj)/.test(normalizedQuery)) {
    filters.parking = "GARAGE";
  } else if (/(parcare|loc de parcare)/.test(normalizedQuery)) {
    filters.parking = "PARKING_SPOT";
  }

  if (/(cu balcon|balcon)/.test(normalizedQuery)) {
    filters.balcony = true;
  }

  if (/(centrala proprie|incalzire proprie)/.test(normalizedQuery)) {
    filters.hasOwnCentralHeating = true;
  }

  return {
    explanation: "Am transformat descrierea in filtre folosind regulile locale de cautare.",
    filters,
    source: "rules"
  };
}

function cleanFilters(filters) {
  const nextFilters = emptyFilters();

  if (countyOptions.includes(filters.county)) {
    nextFilters.county = filters.county;
  }

  if (nextFilters.county && romanianLocations[nextFilters.county]?.includes(filters.city)) {
    nextFilters.city = filters.city;
  }

  if (propertyTypes.includes(filters.propertyType)) {
    nextFilters.propertyType = filters.propertyType;
  }

  if (transactionTypes.includes(filters.transactionType)) {
    nextFilters.transactionType = filters.transactionType;
  }

  if (Number.isInteger(filters.rooms) && filters.rooms > 0) {
    nextFilters.rooms = filters.rooms;
  }

  if (Number.isFinite(filters.minPrice) && filters.minPrice >= 0) {
    nextFilters.minPrice = filters.minPrice;
  }

  if (Number.isFinite(filters.maxPrice) && filters.maxPrice >= 0) {
    nextFilters.maxPrice = filters.maxPrice;
  }

  if (typeof filters.balcony === "boolean") {
    nextFilters.balcony = filters.balcony;
  }

  if (parkingTypes.includes(filters.parking)) {
    nextFilters.parking = filters.parking;
  }

  if (furnishingStatuses.includes(filters.furnished)) {
    nextFilters.furnished = filters.furnished;
  }

  if (typeof filters.hasOwnCentralHeating === "boolean") {
    nextFilters.hasOwnCentralHeating = filters.hasOwnCentralHeating;
  }

  if (nextFilters.minPrice !== null && nextFilters.maxPrice !== null && nextFilters.minPrice > nextFilters.maxPrice) {
    const oldMinPrice = nextFilters.minPrice;
    nextFilters.minPrice = nextFilters.maxPrice;
    nextFilters.maxPrice = oldMinPrice;
  }

  if (listingSortOptions.includes(filters.sort)) {
    nextFilters.sort = filters.sort;
  }

  return nextFilters;
}

function extractOutputText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  return response.output
    ?.flatMap((item) => item.content ?? [])
    ?.find((content) => content.type === "output_text")
    ?.text;
}

async function parseWithOpenAi(query) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: query,
      instructions: [
        "Map Romanian natural-language real estate searches to the provided filter schema.",
        "Return only supported enum values and known Romanian county/city combinations.",
        "If the user asks for rent/chirie/inchiriere use transactionType RENT.",
        "If the user asks for purchase/cumparare/vanzare use transactionType SALE.",
        `Allowed counties/cities: ${JSON.stringify(romanianLocations)}`
      ].join(" "),
      model: env.openAiModel,
      store: false,
      text: {
        format: {
          name: "listing_search_filters",
          schema: {
            additionalProperties: false,
            properties: {
              city: { type: ["string", "null"] },
              county: { type: ["string", "null"] },
              explanation: { type: "string" },
              maxPrice: { type: ["number", "null"] },
              minPrice: { type: ["number", "null"] },
              propertyType: { enum: [...propertyTypes, null] },
              rooms: { type: ["integer", "null"] },
              balcony: { type: ["boolean", "null"] },
              parking: { enum: [...parkingTypes, null] },
              furnished: { enum: [...furnishingStatuses, null] },
              hasOwnCentralHeating: { type: ["boolean", "null"] },
              sort: { enum: listingSortOptions },
              transactionType: { enum: [...transactionTypes, null] }
            },
            required: [
              "city",
              "county",
              "explanation",
              "maxPrice",
              "minPrice",
              "propertyType",
              "rooms",
              "balcony",
              "parking",
              "furnished",
              "hasOwnCentralHeating",
              "sort",
              "transactionType"
            ],
            type: "object"
          },
          strict: true,
          type: "json_schema"
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI search parsing failed.");
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned no search filters.");
  }

  const parsed = JSON.parse(outputText);

  return {
    explanation: parsed.explanation || "Am interpretat cautarea cu AI.",
    filters: cleanFilters(parsed),
    source: "ai"
  };
}

export async function interpretListingSearch(query) {
  if (env.openAiApiKey) {
    try {
      return await parseWithOpenAi(query);
    } catch {
      return parseWithRules(query);
    }
  }

  return parseWithRules(query);
}
