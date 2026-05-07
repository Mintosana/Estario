import { axiosClient } from "./axiosClient.js";

export async function registerRequest(payload) {
  const response = await axiosClient.post("/auth/register", payload);
  return response.data;
}

export async function loginRequest(payload) {
  const response = await axiosClient.post("/auth/login", payload);
  return response.data;
}

export async function meRequest() {
  const response = await axiosClient.get("/auth/me");
  return response.data;
}
