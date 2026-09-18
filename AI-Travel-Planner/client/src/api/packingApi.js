import axiosInstance from "./axios";

export const getPackingItems = async (tripId) => {
  const response = await axiosInstance.get(`/packing/${tripId}`);
  return response.data.data;
};

export const addPackingItems = async (tripId, itemsData) => {
  const response = await axiosInstance.post(`/packing/${tripId}`, itemsData);
  return response.data.data;
};

export const updatePackingItem = async (itemId, updateData) => {
  const response = await axiosInstance.put(`/packing/${itemId}`, updateData);
  return response.data.data;
};

export const deletePackingItem = async (itemId) => {
  const response = await axiosInstance.delete(`/packing/${itemId}`);
  return response.data;
};
