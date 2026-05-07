import { axiosClient } from "./axiosClient.js";

export async function getPendingListings() {
  const response = await axiosClient.get("/admin/listings/pending");
  return response.data;
}

export async function getRejectedListings() {
  const response = await axiosClient.get("/admin/listings/rejected");
  return response.data;
}

export async function approveListing(id) {
  const response = await axiosClient.patch(`/admin/listings/${id}/approve`);
  return response.data;
}

export async function rejectListing(id, reason = "") {
  const response = await axiosClient.patch(`/admin/listings/${id}/reject`, { reason });
  return response.data;
}
