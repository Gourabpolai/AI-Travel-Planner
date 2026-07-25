import api from "./axios";

export const searchPlaces = async (query) => {
  const response = await api.get(`/places/search?q=${encodeURIComponent(query)}`);
  return response.data.data;
};