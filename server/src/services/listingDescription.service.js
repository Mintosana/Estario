import { env } from "../config/env.js";
import { generateGeminiJson, hasGeminiApiKey } from "./gemini.service.js";

const propertyTypeLabels = {
  APARTMENT: "apartament",
  HOUSE: "casa",
  LAND: "teren",
  STUDIO: "garsoniera"
};

const transactionTypeLabels = {
  RENT: "inchiriere",
  SALE: "vanzare"
};

const furnishingLabels = {
  FURNISHED: "mobilat complet",
  PARTIAL: "partial mobilat",
  UNFURNISHED: "nemobilat"
};

const parkingLabels = {
  GARAGE: "garaj",
  NONE: "fara parcare",
  PARKING_SPOT: "loc de parcare"
};

const heatingLabels = {
  CENTRAL: "centrala termica",
  DISTRICT: "termoficare",
  ELECTRIC: "incalzire electrica",
  GAS: "incalzire pe gaz",
  OTHER: "alt tip de incalzire"
};

const centralHeatingLabels = {
  BUILDING: "centrala de bloc",
  INDIVIDUAL: "centrala proprie",
  RESIDENTIAL_COMPLEX: "centrala de ansamblu rezidential"
};

const conditionLabels = {
  GOOD: "stare buna",
  NEEDS_RENOVATION: "necesita renovare",
  NEW: "imobil nou",
  RENOVATED: "renovat"
};

const descriptionResponseSchema = {
  additionalProperties: false,
  properties: {
    description: { type: "string" }
  },
  required: ["description"],
  type: "object"
};

const geminiDescriptionResponseSchema = {
  properties: {
    description: { type: "STRING" }
  },
  propertyOrdering: ["description"],
  required: ["description"],
  type: "OBJECT"
};

function compact(parts) {
  return parts.filter(Boolean);
}

function sentence(parts) {
  return compact(parts).join(", ");
}

function trimDescription(description) {
  return description.replace(/\s+/g, " ").trim().slice(0, 1200);
}

function buildFacts(listing) {
  return compact([
    propertyTypeLabels[listing.propertyType],
    transactionTypeLabels[listing.transactionType],
    listing.city && listing.county ? `${listing.city}, ${listing.county}` : listing.city || listing.county,
    listing.address ? `zona/adresa: ${listing.address}` : null,
    listing.surface ? `${listing.surface} mp` : null,
    listing.rooms ? `${listing.rooms} camere` : null,
    listing.bathrooms ? `${listing.bathrooms} bai` : null,
    listing.floor !== null && listing.floor !== undefined
      ? `etaj ${listing.floor}${listing.totalFloors ? ` din ${listing.totalFloors}` : ""}`
      : null,
    listing.yearBuilt ? `construit in ${listing.yearBuilt}` : null,
    listing.price ? `${listing.price} ${listing.currency}` : null,
    listing.balcony === true ? "balcon" : listing.balcony === false ? "fara balcon" : null,
    listing.hasAirConditioning === true ? "aer conditionat" : listing.hasAirConditioning === false ? "fara aer conditionat" : null,
    listing.hasElevator === true ? "lift" : listing.hasElevator === false ? "fara lift" : null,
    listing.petFriendly === true ? "accepta animale de companie" : listing.petFriendly === false ? "nu accepta animale de companie" : null,
    furnishingLabels[listing.furnished],
    parkingLabels[listing.parking],
    heatingLabels[listing.heatingType],
    centralHeatingLabels[listing.centralHeatingType],
    conditionLabels[listing.buildingCondition],
    listing.energyClass && listing.energyClass !== "UNKNOWN" ? `clasa energetica ${listing.energyClass}` : null
  ]);
}

function buildDeterministicDescription(listing) {
  const propertyLabel = propertyTypeLabels[listing.propertyType] ?? "proprietate";
  const transactionLabel = listing.transactionType === "RENT" ? "inchiriere" : "vanzare";
  const location = listing.city && listing.county ? `${listing.city}, ${listing.county}` : listing.city || "zona mentionata";
  const intro = `${propertyLabel.charAt(0).toUpperCase()}${propertyLabel.slice(1)} disponibil pentru ${transactionLabel} in ${location}.`;
  const coreDetails = sentence([
    listing.surface ? `Proprietatea are o suprafata de ${listing.surface} mp` : null,
    listing.rooms ? `${listing.rooms} camere` : null,
    listing.bathrooms ? `${listing.bathrooms} bai` : null,
    listing.floor !== null && listing.floor !== undefined
      ? `este situata la etajul ${listing.floor}${listing.totalFloors ? ` din ${listing.totalFloors}` : ""}`
      : null,
    listing.yearBuilt ? `imobilul este construit in ${listing.yearBuilt}` : null
  ]);
  const comfortDetails = sentence([
    listing.furnished ? `se preda ${furnishingLabels[listing.furnished]}` : null,
    listing.balcony === true ? "dispune de balcon" : null,
    listing.hasAirConditioning === true ? "are aer conditionat" : null,
    listing.hasElevator === true ? "imobilul are lift" : null,
    listing.petFriendly === true ? "este pet friendly" : null,
    listing.parking && listing.parking !== "NONE" ? `include ${parkingLabels[listing.parking]}` : null,
    listing.heatingType ? `incalzirea este prin ${heatingLabels[listing.heatingType]}` : null,
    listing.centralHeatingType ? centralHeatingLabels[listing.centralHeatingType] : null,
    listing.buildingCondition ? `starea imobilului este: ${conditionLabels[listing.buildingCondition]}` : null
  ]);
  const priceDetails = listing.price ? `Pretul este de ${listing.price} ${listing.currency}.` : "";
  const addressDetails = listing.address ? `Pozitionarea in zona ${listing.address} ofera acces rapid la punctele de interes din apropiere.` : "";
  const close = "Anuntul este potrivit pentru cei care cauta o proprietate clar prezentata, cu detalii usor de comparat.";

  return trimDescription(
    [intro, coreDetails ? `${coreDetails}.` : "", comfortDetails ? `${comfortDetails}.` : "", priceDetails, addressDetails, close].join(" ")
  );
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

async function generateWithOpenAi(listing, fallbackDescription) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: JSON.stringify({
        fallbackDescription,
        facts: buildFacts(listing),
        listing
      }),
      instructions: [
        "Generate one Romanian real-estate listing description.",
        "Write without diacritics.",
        "Use only supplied facts; do not invent amenities, distances, financing terms, or guarantees.",
        "Keep it professional, clear, and between 120 and 900 characters.",
        "Return JSON only."
      ].join(" "),
      model: env.openAiModel,
      store: false,
      text: {
        format: {
          name: "listing_description_generation",
          schema: descriptionResponseSchema,
          strict: true,
          type: "json_schema"
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI description generation failed.");
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned no listing description.");
  }

  const parsed = JSON.parse(outputText);
  return trimDescription(parsed.description);
}

async function generateWithGemini(listing, fallbackDescription) {
  const parsed = await generateGeminiJson({
    prompt: [
      "Generate one Romanian real-estate listing description.",
      "Write without diacritics.",
      "Use only supplied facts; do not invent amenities, distances, financing terms, or guarantees.",
      "Keep it professional, clear, and between 120 and 900 characters.",
      `Facts: ${JSON.stringify({ fallbackDescription, facts: buildFacts(listing), listing })}`
    ].join("\n"),
    schema: geminiDescriptionResponseSchema
  });

  return trimDescription(parsed.description);
}

export async function generateListingDescription(listing) {
  const fallbackDescription = buildDeterministicDescription(listing);

  if (hasGeminiApiKey()) {
    try {
      return {
        description: await generateWithGemini(listing, fallbackDescription),
        source: "gemini"
      };
    } catch {
      // Continue to OpenAI fallback when both providers are configured.
    }
  }

  if (env.openAiApiKey && !env.openAiApiKey.startsWith("AIza")) {
    try {
      return {
        description: await generateWithOpenAi(listing, fallbackDescription),
        source: "ai"
      };
    } catch {
      return {
        description: fallbackDescription,
        source: "rules"
      };
    }
  }

  return {
    description: fallbackDescription,
    source: "rules"
  };
}
