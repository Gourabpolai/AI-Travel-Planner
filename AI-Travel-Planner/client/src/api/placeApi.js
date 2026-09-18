import axios from "axios";
import api from "./axios";

export const searchPlaces = async (query, signal) => {
  if (!query || !query.trim()) return [];
  try {
    const response = await api.get(`/places/search?q=${encodeURIComponent(query.trim())}`, { signal });
    const data = response.data?.data;
    
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  } catch (error) {
    if (axios.isCancel(error) || error?.name === "CanceledError" || error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
      return null; // Silently return null for cancelled requests
    }
    console.error("Error fetching place suggestions from backend:", error);
    return [];
  }
};

export const getPlacePhotos = async (query) => {
  if (!query || !query.trim()) return [];
  try {
    const response = await api.get(`/places/photos?q=${encodeURIComponent(query.trim())}`);
    return response.data?.data || [];
  } catch (error) {
    console.error("Error fetching real place photos:", error);
    return [];
  }
};

export const getDestinationDetails = async (query) => {
  if (!query || !query.trim()) return null;
  try {
    const response = await api.get(`/places/details?q=${encodeURIComponent(query.trim())}`);
    return response.data?.data || null;
  } catch (error) {
    console.error("Error fetching destination details from backend:", error);
    return null;
  }
};

export const getPopularPlaces = async (destination) => {
  if (!destination || !destination.trim()) return [];
  try {
    const response = await api.get(`/places/popular?destination=${encodeURIComponent(destination.trim())}`);
    return response.data?.places || [];
  } catch (error) {
    console.error("Error fetching popular places from backend:", error);
    return [];
  }
};

export const getPlaceDetails = async (placeId, signal) => {
  if (!placeId || !placeId.trim()) return null;
  try {
    const response = await api.get(`/places/${encodeURIComponent(placeId.trim())}`, { signal });
    return response.data?.data || null;
  } catch (error) {
    if (axios.isCancel(error) || error?.name === "CanceledError" || error?.name === "AbortError" || error?.code === "ERR_CANCELED") {
      return null;
    }
    console.error("Error fetching place details from backend:", error);
    throw error;
  }
};