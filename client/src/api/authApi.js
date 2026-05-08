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

export async function updateProfileRequest(payload) {
  const response = await axiosClient.put("/auth/profile", payload);
  return response.data;
}

export async function uploadProfileAvatarRequest(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await axiosClient.post("/auth/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}
