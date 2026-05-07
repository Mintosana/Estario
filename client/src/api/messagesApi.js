import { axiosClient } from "./axiosClient.js";

export async function createMessage(listingId, payload) {
  const response = await axiosClient.post(`/listings/${listingId}/messages`, payload);
  return response.data;
}

export async function getListingMessages(listingId) {
  const response = await axiosClient.get(`/my-listings/${listingId}/messages`);
  return response.data;
}
