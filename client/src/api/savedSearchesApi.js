import { axiosClient } from "./axiosClient.js";

export async function getSavedSearches() {
  const response = await axiosClient.get("/saved-searches");
  return response.data;
}

export async function createSavedSearch(payload) {
  const response = await axiosClient.post("/saved-searches", payload);
  return response.data;
}

export async function updateSavedSearch(id, payload) {
  const response = await axiosClient.put(`/saved-searches/${id}`, payload);
  return response.data;
}

export async function deleteSavedSearch(id) {
  await axiosClient.delete(`/saved-searches/${id}`);
}
