import api from "./axios";

// Generate AI itinerary
export const generateItinerary = async (tripId) => {
  const response = await api.post(`/itineraries/generate/${tripId}`);
  return response.data;
};

// Get itinerary (always returns Array of items)
export const getItinerary = async (tripId) => {
  try {
    const response = await api.get(`/itineraries/${tripId}`);
    const data = response.data?.data || response.data?.items;
    if (Array.isArray(data)) return data;
    if (Array.isArray(response.data?.items)) return response.data.items;
    return [];
  } catch (error) {
    console.error("Error fetching itinerary:", error);
    return [];
  }
};

// Regenerate itinerary
export const regenerateItinerary = async (tripId) => {
  const response = await api.post(`/itineraries/regenerate/${tripId}`);
  return response.data;
};

// Delete itinerary
export const deleteItinerary = async (tripId) => {
  const response = await api.delete(`/itineraries/${tripId}`);
  return response.data;
};

// Add individual itinerary item
export const addItineraryItem = async (tripId, itemData) => {
  const response = await api.post(`/itineraries/${tripId}`, itemData);
  return response.data.item;
};

// Delete individual itinerary item
export const deleteItineraryItem = async (itemId) => {
  const response = await api.delete(`/itineraries/item/${itemId}`);
  return response.data;
};