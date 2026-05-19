import { env } from "../config/env.js";

export function getGeminiApiKey() {
  if (env.googleApiKey) {
    return env.googleApiKey;
  }

  if (env.openAiApiKey.startsWith("AIza")) {
    return env.openAiApiKey;
  }

  return "";
}

export function hasGeminiApiKey() {
  return Boolean(getGeminiApiKey());
}

export async function generateGeminiJson({ prompt, schema }) {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error("Missing Gemini API key.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${env.googleModel}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed with ${response.status}: ${errorText.slice(0, 500)}`);
  }

  const payload = await response.json();
  const outputText = payload.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!outputText) {
    throw new Error("Gemini returned no JSON text.");
  }

  return JSON.parse(outputText);
}
