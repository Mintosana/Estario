import { env } from "../config/env.js";
import { generateGeminiJson, hasGeminiApiKey } from "./gemini.service.js";

const qualityResponseSchema = {
  additionalProperties: false,
  properties: {
    descriptionSuggestion: { type: ["string", "null"] },
    issues: {
      items: {
        additionalProperties: false,
        properties: {
          message: { type: "string" },
          severity: { enum: ["critical", "warning", "info"] }
        },
        required: ["severity", "message"],
        type: "object"
      },
      type: "array"
    },
    summary: { type: "string" },
    titleSuggestions: {
      items: { type: "string" },
      type: "array"
    }
  },
  required: ["summary", "issues", "titleSuggestions", "descriptionSuggestion"],
  type: "object"
};

const geminiQualityResponseSchema = {
  properties: {
    descriptionSuggestion: { nullable: true, type: "STRING" },
    issues: {
      items: {
        properties: {
          message: { type: "STRING" },
          severity: { enum: ["critical", "warning", "info"], type: "STRING" }
        },
        propertyOrdering: ["severity", "message"],
        required: ["severity", "message"],
        type: "OBJECT"
      },
      type: "ARRAY"
    },
    summary: { type: "STRING" },
    titleSuggestions: {
      items: { type: "STRING" },
      type: "ARRAY"
    }
  },
  propertyOrdering: ["summary", "issues", "titleSuggestions", "descriptionSuggestion"],
  required: ["summary", "issues", "titleSuggestions", "descriptionSuggestion"],
  type: "OBJECT"
};

function clampScore(score) {
  return Math.max(0, Math.min(100, score));
}

function addIssue(issues, severity, message, penalty) {
  issues.push({ message, severity });
  return penalty;
}

function pricePerSquareMeter(listing) {
  if (!listing.price || !listing.surface) {
    return null;
  }

  return Number((listing.price / listing.surface).toFixed(0));
}

function priceThresholdIssue(listing, sqmPrice) {
  if (!sqmPrice || listing.currency !== "EUR") {
    return null;
  }

  if (listing.transactionType === "SALE") {
    if (sqmPrice < 500) {
      return "Pretul pe mp pare foarte mic pentru vanzare. Verifica daca pretul si suprafata sunt corecte.";
    }

    if (sqmPrice > 6000) {
      return "Pretul pe mp pare foarte mare pentru vanzare. Explica in descriere dotarile sau zona care justifica pretul.";
    }
  }

  if (listing.transactionType === "RENT") {
    if (sqmPrice < 3) {
      return "Chiria pe mp pare foarte mica. Verifica daca pretul lunar si suprafata sunt introduse corect.";
    }

    if (sqmPrice > 40) {
      return "Chiria pe mp pare foarte mare. Mentioneaza clar avantajele proprietatii sau serviciile incluse.";
    }
  }

  return null;
}

function issueDedupeKey(issue) {
  const normalizedMessage = issue.message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalizedMessage.includes("telefon")) {
    return "owner-phone";
  }

  if (normalizedMessage.includes("profil") && normalizedMessage.includes("proprietar")) {
    return "owner-profile";
  }

  if (normalizedMessage.includes("descriere")) {
    return "listing-description";
  }

  if (normalizedMessage.includes("fotograf") || normalizedMessage.includes("poza") || normalizedMessage.includes("imagini")) {
    return "images";
  }

  return normalizedMessage;
}

function dedupeIssues(issues) {
  const seenKeys = new Set();

  return issues.filter((issue) => {
    const key = issueDedupeKey(issue);

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function buildDeterministicReview(listing, user) {
  const issues = [];
  let score = 100;
  const imageCount = listing.imageCount ?? 0;
  const description = listing.description ?? "";
  const title = listing.title ?? "";
  const sqmPrice = pricePerSquareMeter(listing);
  const missingCoreFields = [
    ["city", "localitatea"],
    ["county", "judetul"],
    ["address", "adresa"],
    ["price", "pretul"],
    ["surface", "suprafata"],
    ["latitude", "pozitia pe harta"],
    ["longitude", "pozitia pe harta"]
  ].filter(([field]) => listing[field] === null || listing[field] === undefined || listing[field] === "");

  if (missingCoreFields.length) {
    const uniqueLabels = [...new Set(missingCoreFields.map(([, label]) => label))];
    score -= addIssue(
      issues,
      "critical",
      `Completeaza campurile esentiale: ${uniqueLabels.join(", ")}.`,
      16
    );
  }

  if (title.length < 18) {
    score -= addIssue(
      issues,
      "warning",
      "Titlul este valid, dar prea scurt pentru a comunica rapid zona si avantajul principal.",
      8
    );
  }

  if (description.length < 120) {
    score -= addIssue(
      issues,
      "warning",
      "Descrierea este scurta. Adauga informatii despre compartimentare, finisaje, zona si costuri.",
      12
    );
  }

  if (imageCount === 0) {
    score -= addIssue(issues, "critical", "Adauga fotografii. Anunturile fara imagini primesc mai putina incredere.", 18);
  } else if (imageCount < 3) {
    score -= addIssue(issues, "warning", "Adauga cel putin 3 fotografii: exterior, camera principala si baie/bucatarie.", 8);
  }

  if (listing.propertyType !== "LAND" && !listing.rooms) {
    score -= addIssue(issues, "warning", "Completeaza numarul de camere pentru o filtrare mai buna.", 7);
  }

  if (listing.propertyType !== "LAND" && !listing.bathrooms) {
    score -= addIssue(issues, "info", "Numarul de bai ajuta vizitatorii sa compare rapid proprietatile.", 4);
  }

  if (listing.propertyType !== "LAND" && !listing.yearBuilt) {
    score -= addIssue(issues, "info", "Anul constructiei creste increderea si ajuta la evaluarea pretului.", 4);
  }

  if (listing.propertyType !== "LAND" && !listing.furnished) {
    score -= addIssue(issues, "info", "Mentioneaza nivelul de mobilare pentru cautari mai precise.", 4);
  }

  if (listing.propertyType !== "LAND" && !listing.heatingType) {
    score -= addIssue(issues, "info", "Adauga tipul de incalzire, mai ales pentru chirii si apartamente.", 4);
  }

  if (listing.propertyType !== "LAND" && listing.heatingType === "CENTRAL" && !listing.centralHeatingType) {
    score -= addIssue(issues, "info", "Mentioneaza tipul centralei: proprie, de bloc sau de ansamblu.", 4);
  }

  if (!user.phone) {
    score -= addIssue(issues, "info", "Completeaza telefonul in profil pentru mai multa incredere din partea clientilor.", 3);
  }

  if (!user.bio) {
    score -= addIssue(issues, "info", "Adauga o scurta descriere in profilul proprietarului.", 2);
  }

  const priceIssue = priceThresholdIssue(listing, sqmPrice);
  if (priceIssue) {
    score -= addIssue(issues, "warning", priceIssue, 9);
  }

  const finalScore = clampScore(score);

  return {
    descriptionSuggestion: null,
    issues,
    score: finalScore,
    source: "rules",
    summary:
      finalScore >= 85
        ? "Anuntul este bine completat si poate fi trimis spre aprobare."
        : finalScore >= 65
          ? "Anuntul este utilizabil, dar cateva completari ii pot creste increderea."
          : "Anuntul are lipsuri importante care pot reduce sansele de aprobare sau contact.",
    titleSuggestions: []
  };
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

async function buildAiReview(listing, deterministicReview) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: JSON.stringify({
        deterministicReview,
        listing
      }),
      instructions: [
        "Review this Romanian real-estate listing draft for clarity, trust, and completeness.",
        "Do not invent facts. Suggestions must be based only on supplied fields.",
        "Write all user-facing text in Romanian without diacritics.",
        "Keep title suggestions under 100 characters and descriptionSuggestion under 900 characters.",
        "Return practical issues an owner can fix before submitting the listing."
      ].join(" "),
      model: env.openAiModel,
      store: false,
      text: {
        format: {
          name: "listing_quality_review",
          schema: qualityResponseSchema,
          strict: true,
          type: "json_schema"
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error("OpenAI listing quality review failed.");
  }

  const payload = await response.json();
  const outputText = extractOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI returned no listing quality review.");
  }

  const parsed = JSON.parse(outputText);

  return {
    ...deterministicReview,
    descriptionSuggestion: parsed.descriptionSuggestion || null,
    issues: dedupeIssues([...deterministicReview.issues, ...parsed.issues]).slice(0, 12),
    source: "ai",
    summary: parsed.summary || deterministicReview.summary,
    titleSuggestions: parsed.titleSuggestions.slice(0, 3)
  };
}

async function buildGeminiReview(listing, deterministicReview) {
  const parsed = await generateGeminiJson({
    prompt: [
      "Review this Romanian real-estate listing draft for clarity, trust, and completeness.",
      "Do not invent facts. Suggestions must be based only on supplied fields.",
      "Write all user-facing text in Romanian without diacritics.",
      "Keep title suggestions under 100 characters and descriptionSuggestion under 900 characters.",
      "Return practical issues an owner can fix before submitting the listing.",
      `Draft and local rule review: ${JSON.stringify({ deterministicReview, listing })}`
    ].join("\n"),
    schema: geminiQualityResponseSchema
  });

  return {
    ...deterministicReview,
    descriptionSuggestion: parsed.descriptionSuggestion || null,
    issues: dedupeIssues([...deterministicReview.issues, ...(parsed.issues ?? [])]).slice(0, 12),
    source: "gemini",
    summary: parsed.summary || deterministicReview.summary,
    titleSuggestions: (parsed.titleSuggestions ?? []).slice(0, 3)
  };
}

export async function reviewListingQuality(listing, user) {
  const deterministicReview = buildDeterministicReview(listing, user);

  if (hasGeminiApiKey()) {
    try {
      return await buildGeminiReview(listing, deterministicReview);
    } catch {
      // Continue to OpenAI fallback when both providers are configured.
    }
  }

  if (!env.openAiApiKey || env.openAiApiKey.startsWith("AIza")) {
    return deterministicReview;
  }

  try {
    return await buildAiReview(listing, deterministicReview);
  } catch {
    return deterministicReview;
  }
}
