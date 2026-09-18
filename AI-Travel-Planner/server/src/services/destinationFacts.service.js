const { safeFetchWithTimeout } = require("../utils/apiResilience");

/**
 * Destination Facts Service — Real Geographic & Factual Metadata
 *
 * Single Responsibility: Resolve authentic geospatial attributes, elevation,
 * timezone, live weather, currency, languages, and distance calculations.
 */

// Haversine distance in kilometers between two coordinates
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (lat1 === null || lat1 === undefined || lon1 === null || lon1 === undefined ||
      lat2 === null || lat2 === undefined || lon2 === null || lon2 === undefined) {
    return null;
  }

  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place (e.g. 4.2 km)
};

// Known country information mappings (Currency, Languages, Timezones)
const COUNTRY_FACTS = {
  india: {
    currency: "INR (₹ - Indian Rupee)",
    languages: ["Hindi", "English"],
    stateLanguages: {
      odisha: "Odia",
      "andhra pradesh": "Telugu",
      telangana: "Telugu",
      karnataka: "Kannada",
      "tamil nadu": "Tamil",
      kerala: "Malayalam",
      maharashtra: "Marathi",
      goa: "Konkani, English",
      gujarat: "Gujarati",
      "west bengal": "Bengali",
      rajasthan: "Hindi, Rajasthani",
      punjab: "Punjabi",
      delhi: "Hindi, English",
      "uttar pradesh": "Hindi, Urdu",
      "himachal pradesh": "Hindi, Pahari",
      ladakh: "Ladakhi, Tibetan",
      "jammu and kashmir": "Kashmiri, Urdu",
      assam: "Assamese",
      sikkim: "Nepali, Sikkimese",
    },
  },
  france: {
    currency: "EUR (€ - Euro)",
    languages: ["French"],
  },
  japan: {
    currency: "JPY (¥ - Japanese Yen)",
    languages: ["Japanese"],
  },
  "united states": {
    currency: "USD ($ - US Dollar)",
    languages: ["English"],
  },
  "united kingdom": {
    currency: "GBP (£ - British Pound)",
    languages: ["English"],
  },
  italy: {
    currency: "EUR (€ - Euro)",
    languages: ["Italian"],
  },
  spain: {
    currency: "EUR (€ - Euro)",
    languages: ["Spanish"],
  },
  germany: {
    currency: "EUR (€ - Euro)",
    languages: ["German"],
  },
  uae: {
    currency: "AED (د.إ - UAE Dirham)",
    languages: ["Arabic", "English"],
  },
  thailand: {
    currency: "THB (฿ - Thai Baht)",
    languages: ["Thai"],
  },
  indonesia: {
    currency: "IDR (Rp - Indonesian Rupiah)",
    languages: ["Indonesian"],
  },
  vietnam: {
    currency: "VND (₫ - Vietnamese Dong)",
    languages: ["Vietnamese"],
  },
  singapore: {
    currency: "SGD (S$ - Singapore Dollar)",
    languages: ["English", "Mandarin", "Malay", "Tamil"],
  },
  australia: {
    currency: "AUD (A$ - Australian Dollar)",
    languages: ["English"],
  },
  canada: {
    currency: "CAD (C$ - Canadian Dollar)",
    languages: ["English", "French"],
  },
  switzerland: {
    currency: "CHF (Fr. - Swiss Franc)",
    languages: ["German", "French", "Italian"],
  },
};

/**
 * Get factual currency and languages for a country and state.
 * @param {string} countryName
 * @param {string} stateName
 * @returns {{currency: string, languages: string}}
 */
const getCountryFacts = (countryName, stateName) => {
  const normCountry = (countryName || "").toLowerCase().trim();
  const normState = (stateName || "").toLowerCase().trim();

  const cData = COUNTRY_FACTS[normCountry] || {
    currency: "Local Currency",
    languages: ["English"],
  };

  let langStr = cData.languages.join(", ");
  if (cData.stateLanguages && normState && cData.stateLanguages[normState]) {
    langStr = `${cData.stateLanguages[normState]}, ${langStr}`;
  }

  return {
    currency: cData.currency,
    languages: langStr,
  };
};

/**
 * Fetch elevation and timezone from Open-Meteo API.
 *
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<{elevation: string | null, timezone: string | null, currentTemp: string | null}>}
 */
const getElevationAndTimezone = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    return { elevation: null, timezone: null, currentTemp: null };
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
    const res = await safeFetchWithTimeout(url, {}, 3500);

    if (res.ok) {
      const data = await res.json();
      const elevMeters = data.elevation;
      const elevFeet = Math.round(elevMeters * 3.28084);
      const elevationStr = elevMeters !== undefined ? `${elevMeters} m (${elevFeet} ft)` : null;
      const currentTemp = data.current?.temperature_2m !== undefined ? `${data.current.temperature_2m}°C` : null;

      return {
        elevation: elevationStr,
        timezone: data.timezone || null,
        currentTemp,
      };
    }
  } catch (err) {
    console.warn(`Open-Meteo lookup skipped for (${latitude}, ${longitude}):`, err.message);
  }

  return { elevation: null, timezone: null, currentTemp: null };
};

/**
 * Determine best time to visit based on latitude and regional climate patterns.
 * @param {number} latitude
 * @param {string} stateName
 * @param {string} countryName
 * @returns {string}
 */
const getBestTimeToVisit = (latitude, stateName, countryName) => {
  const normCountry = (countryName || "").toLowerCase();
  const normState = (stateName || "").toLowerCase();

  // Tropical / Indian subcontinent
  if (normCountry.includes("india") || normCountry.includes("sri lanka") || normCountry.includes("thailand")) {
    if (normState.includes("ladakh") || normState.includes("himachal") || normState.includes("kashmir") || normState.includes("sikkim")) {
      return "May to October (Pleasant mountain summers)";
    }
    return "October to March (Mild, pleasant winter weather)";
  }

  // European / Northern Hemisphere temperate
  if (normCountry.includes("france") || normCountry.includes("italy") || normCountry.includes("spain") || normCountry.includes("japan") || normCountry.includes("germany") || normCountry.includes("united kingdom")) {
    return "April to October (Spring to Autumn pleasant weather)";
  }

  // Southern Hemisphere (Australia, New Zealand)
  if (normCountry.includes("australia") || normCountry.includes("new zealand")) {
    return "September to May (Spring to warm summer)";
  }

  // General latitude based
  if (latitude > 30) {
    return "April to October";
  } else if (latitude < -10) {
    return "November to April";
  }
  return "October to March";
};

module.exports = {
  calculateDistanceKm,
  getCountryFacts,
  getElevationAndTimezone,
  getBestTimeToVisit,
};
