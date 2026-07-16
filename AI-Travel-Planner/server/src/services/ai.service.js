require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const generateItinerary = async (trip) => {
  const prompt = `
You are an expert travel planner.

Create a ${trip.duration}-day travel itinerary.

Trip Details:
- Destination: ${trip.destination}
- Budget: ₹${trip.budget}
- Number of Travelers: ${trip.travelers}
- Duration: ${trip.duration} days

Generate a realistic itinerary.

Return ONLY valid JSON.

{
  "days": [
    {
      "day": 1,
      "title": "Arrival",
      "activities": [
        {
          "time": "09:00 AM",
          "title": "Check-in Hotel",
          "description": "Relax after your journey",
          "location": "Hotel",
          "estimatedCost": 0
        }
      ]
    }
  ]
}
`;

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Gemini Attempt ${attempt}/${MAX_RETRIES}`);

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      const text = response.text;

      const cleanText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      return JSON.parse(cleanText);

    } catch (error) {
      console.error(
        `Gemini Attempt ${attempt} Failed:`,
        error.message
      );

      const is503 =
        error.message.includes("503") ||
        error.message.includes("UNAVAILABLE");

      if (is503 && attempt < MAX_RETRIES) {
        const waitTime = attempt * 2000;

        console.log(`Retrying in ${waitTime / 1000} seconds...`);

        await delay(waitTime);

        continue;
      }

      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON returned by Gemini.");
      }

      throw error;
    }
  }
};
module.exports = {
  generateItinerary,
};