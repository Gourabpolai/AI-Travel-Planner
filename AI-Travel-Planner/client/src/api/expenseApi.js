import axiosInstance from "./axios";

export const getExpenses = async (tripId) => {
  const response = await axiosInstance.get(`/expenses/${tripId}`);
  return response.data.data;
};

export const addExpense = async (tripId, expenseData) => {
  const response = await axiosInstance.post(`/expenses/${tripId}`, expenseData);
  return response.data.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await axiosInstance.delete(`/expenses/${expenseId}`);
  return response.data;
};
