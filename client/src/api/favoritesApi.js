import { axiosClient } from "./axiosClient.js";

export async function getFavorites() {
  const response = await axiosClient.get("/favorites");
  return response.data;
}

export async function addFavorite(listingId) {
  const response = await axiosClient.post(`/favorites/${listingId}`);
  return response.data;
}

export async function removeFavorite(listingId) {
  await axiosClient.delete(`/favorites/${listingId}`);
}
