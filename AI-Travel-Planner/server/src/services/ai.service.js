require("dotenv").config();
const { GoogleGenAI, Type } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyDummyKeyForProductionFallback";
const ai = new GoogleGenAI({ apiKey });

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/**
 * PHASE 1: AI Tourist Attraction Name Discovery
 *
 * Prompts Gemini AI to return strictly a JSON array of the 20 most famous
 * tourist attraction names in and around the destination.
 *
 * @param {string} destination - City / destination name
 * @returns {Promise<string[]>} Array of attraction names
 */
const discoverAttractionNames = async (destination) => {
  if (!destination || !destination.trim()) return [];

  const prompt = `
List the 20 most famous, iconic, and must-visit tourist attractions, natural landmarks, waterfalls, mountain peaks, viewpoints, heritage temples, historic forts, wildlife sanctuaries, and famous sights that travelers visit in and around ${destination}.

STRICT FORMAT REQUIREMENT:
Return ONLY a valid JSON array of strings containing the attraction names.
Do NOT include numbers, descriptions, markdown formatting, ratings, or any other keys.

Example:
["Attraction One", "Attraction Two", "Attraction Three"]
`;

  const models = ["gemini-flash-latest", "gemini-3.6-flash"];

  for (const model of models) {
    try {
      const aiPromise = ai.models.generateContent({
        model,
        contents: prompt,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini AI (${model}) request timed out`)), 15000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      const text = response.text || "";
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const names = JSON.parse(cleanText);

      if (Array.isArray(names) && names.length > 0) {
        return names
          .filter((n) => typeof n === "string" && n.trim().length > 1)
          .map((n) => n.trim());
      }
    } catch (err) {
      console.warn(`AI attraction discovery error with ${model} for "${destination}":`, err.message);
    }
  }

  return [];
};

/**
 * Factual AI Destination Overview Summarizer
 *
 * Strictly grounded in real factual context (Wikipedia extract, state, country, elevation).
 * Zero hallucination policy.
 *
 * @param {string} destination
 * @param {string} wikiExtract - Factual Wikipedia text
 * @param {object} facts - Real geographic context
 * @returns {Promise<string>}
 */
const generateDestinationSummary = async (destination, wikiExtract = "", facts = {}) => {
  if (wikiExtract && wikiExtract.length > 50) {
    try {
      const prompt = `
You are a professional travel editor.
Summarize the following factual information about ${destination} into an engaging, clean, 2-paragraph travel overview (around 120-150 words).

SOURCE CONTEXT:
${wikiExtract}

ADDITIONAL VERIFIED FACTS:
State/Region: ${facts.state || "N/A"}
Country: ${facts.country || "N/A"}
Elevation: ${facts.elevation || "N/A"}

STRICT REQUIREMENT:
1. Base every statement strictly on the provided factual context.
2. Do NOT invent attractions, history, or facts not mentioned in the source context.
3. Return clean plain text only.
`;

      const aiPromise = ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini AI summary timed out")), 15000)
      );

      const response = await Promise.race([aiPromise, timeoutPromise]);
      if (response && response.text && response.text.trim().length > 30) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn(`AI summary rewrite skipped for "${destination}":`, err.message);
    }
    // If AI rewrite times out, return original Wikipedia extract directly
    return wikiExtract.trim();
  }

  // Factual deterministic fallback when no Wikipedia extract is available
  const locationParts = [facts.state, facts.country].filter(Boolean).join(", ");
  const elevPart = facts.elevation ? ` at an elevation of ${facts.elevation}` : "";
  return `${destination}${locationParts ? ` is located in ${locationParts}` : ""}${elevPart}. Known for its picturesque landscapes, cultural heritage, and scenic attractions, it offers a memorable experience for travelers seeking exploration and discovery.`;
};

const generateItinerary = async (trip) => {
  try {
    // Bound user-controlled parameters to prevent prompt bloat and injection
    const cleanDestination = typeof trip.destination === "string" ? trip.destination.slice(0, 100).trim() : "India";
    const cleanDuration = Math.min(30, Math.max(1, parseInt(trip.duration, 10) || 3));
    const cleanTravelers = Math.min(50, Math.max(1, parseInt(trip.travelers, 10) || 1));
    const cleanBudget = typeof trip.budget === "string" ? trip.budget.slice(0, 50).trim() : (trip.budget || "Standard");

    const selectedPlaces =
      trip.selectedPlaces && Array.isArray(trip.selectedPlaces)
        ? trip.selectedPlaces
            .slice(0, 20)
            .map((place) => ({
              name: typeof place.name === "string" ? place.name.slice(0, 100).trim() : "Attraction",
              category: typeof place.category === "string" ? place.category.slice(0, 50).trim() : "Attraction",
            }))
        : [];

    const selectedPlacesText =
      selectedPlaces.length > 0
        ? selectedPlaces
            .map(
              (place, index) =>
                `${index + 1}. ${place.name} - ${place.category}`
            )
            .join("\n")
        : "No places selected. Choose suitable attractions yourself.";

    const prompt = `
You are TripSync's AI travel planner.

Create a realistic and personalized travel itinerary.

TRIP INFORMATION:

Destination: ${cleanDestination}
Start Date: ${trip.startDate}
End Date: ${trip.endDate}
Duration: ${cleanDuration} days
Budget: ${cleanBudget}
Number of Travelers: ${cleanTravelers}

PLACES SELECTED BY THE USER:

${selectedPlacesText}

IMPORTANT RULES:

1. If the user selected places, include EVERY selected place in the itinerary.
2. Do not remove or ignore selected places.
3. Do not repeat the same place.
4. Group geographically nearby places together when possible.
5. Create a realistic schedule for each day.
6. Do not schedule too many activities in one day.
7. Consider travel time between attractions.
8. Include breakfast, lunch and dinner when appropriate.
9. Keep the itinerary reasonable for the given budget.
10. If no places were selected, choose popular attractions in the destination.
11. Do not invent impossible or obviously unrelated attractions.
12. Return ONLY the requested JSON structure.
13. Design the itinerary so that each day explores a distinctly DIFFERENT region, neighborhood, or nearby town within or around the destination. Do not repeat the same locations or stay in the exact same area every day. Ensure a diverse geographic spread.
${trip.isRegenerate ? `14. CRITICAL REGENERATION INSTRUCTION: The user has requested to REGENERATE this itinerary. You MUST provide a COMPLETELY DIFFERENT set of activities, restaurants, and daily schedules than typical suggestions. Give them a fresh, alternative experience. Random Seed: ${Date.now()}` : ""}
`;

    const models = ["gemini-3.6-flash", "gemini-flash-latest"];
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`🤖 Generating itinerary for: ${trip.destination} using ${model}`);

        const aiPromise = ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            temperature: trip.isRegenerate ? 0.9 : 0.7,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.INTEGER },
                      title: { type: Type.STRING },
                      activities: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            time: { type: Type.STRING },
                            title: { type: Type.STRING },
                            location: { type: Type.STRING },
                            description: { type: Type.STRING },
                            estimatedCost: { type: Type.INTEGER },
                          },
                          required: ["time", "title", "location", "description"],
                        },
                      },
                    },
                    required: ["day", "title", "activities"],
                  },
                },
              },
              required: ["days"],
            },
          },
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Gemini AI (${model}) request timed out`)), 25000)
        );

        const response = await Promise.race([aiPromise, timeoutPromise]);

        console.log(`🤖 Gemini response received from ${model}`);

        if (!response || !response.text) {
          throw new Error("Gemini returned an empty response");
        }

        const itinerary = JSON.parse(response.text);

        if (!itinerary.days || !Array.isArray(itinerary.days)) {
          throw new Error("Invalid itinerary format returned by Gemini");
        }

        console.log(`✅ Itinerary generated successfully with ${itinerary.days.length} days using ${model}`);
        return itinerary;
      } catch (error) {
        console.warn(`⚠️ Gemini itinerary generation failed with ${model}:`, error.message);
        lastError = error;
      }
    }

    console.error("❌ All models failed for itinerary generation.");
    throw lastError;
  } catch (error) {
    console.error("❌ Itinerary generation process failed:");
    console.error(error);
    throw error;
  }
};

module.exports = {
  discoverAttractionNames,
  generateDestinationSummary,
  generateFactualOverview: generateDestinationSummary,
  generateItinerary,
};