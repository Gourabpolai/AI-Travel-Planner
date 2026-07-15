require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

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

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: prompt,
  });

  const text = response.text;

  const cleanText = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

try {
  return JSON.parse(cleanText);
} catch (error) {
  console.error(cleanText);
  throw new Error("Invalid JSON returned by Gemini.");
}};
module.exports = {
  generateItinerary,
};