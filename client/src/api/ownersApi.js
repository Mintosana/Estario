import { axiosClient } from "./axiosClient.js";

export async function getOwnerProfile(ownerId) {
  const response = await axiosClient.get(`/owners/${ownerId}`);
  return response.data;
}
