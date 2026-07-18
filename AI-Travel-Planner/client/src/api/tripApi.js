import axiosInstance from "./axios";

export const getAllTrips = async () => {
  const response = await axiosInstance.get("/trips");
  return response.data;
};

export const getTripById = async (tripId) => {
  const response = await axiosInstance.get(`/trips/${tripId}`);
  return response.data;
};

export const createTrip = async (tripData) => {
  const response = await axiosInstance.post("/trips", tripData);
  return response.data;
};

export const deleteTrip = async (tripId) => {
  const response = await axiosInstance.delete(`/trips/${tripId}`);
  return response.data;
};