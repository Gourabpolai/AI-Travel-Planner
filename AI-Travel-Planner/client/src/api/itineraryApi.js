import api from "./axios";

// Generate AI itinerary
export const generateItinerary = async (tripId) => {
  const response = await api.post(`/itineraries/generate/${tripId}`);
  return response.data;
};

// Get itinerary
export const getItinerary = async (tripId) => {
  const response = await api.get(`/itineraries/${tripId}`);
  return response.data;
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