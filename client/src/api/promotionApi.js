import { axiosClient } from "./axiosClient.js";

export async function buyPromotionBundle(bundleKey, returnPath = "/profile") {
  const response = await axiosClient.post("/promotion/bundles", { bundleKey, returnPath });
  return response.data;
}

export async function sponsorListing(listingId) {
  const response = await axiosClient.post(`/listings/${listingId}/sponsor`);
  return response.data;
}
