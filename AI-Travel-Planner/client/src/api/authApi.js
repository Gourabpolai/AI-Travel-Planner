import axiosInstance from "./axios";

export const loginUser = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};

export const registerUser = async (registerData) => {
  const response = await axiosInstance.post("/auth/register", registerData);
  return response.data;
};

export const getProfile = async () => {
  const response = await axiosInstance.get("/auth/profile");
  return response.data;
};