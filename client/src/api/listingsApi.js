import { axiosClient } from "./axiosClient.js";

export async function getListings(params = {}) {
  const response = await axiosClient.get("/listings", { params });
  return response.data;
}

export async function getListing(id) {
  const response = await axiosClient.get(`/listings/${id}`);
  return response.data;
}

export async function interpretListingSearch(query) {
  const response = await axiosClient.post("/listings/interpret-search", { query });
  return response.data;
}

export async function getMyListings() {
  const response = await axiosClient.get("/my-listings");
  return response.data;
}

export async function getMyListingAnalytics() {
  const response = await axiosClient.get("/my-listings/analytics");
  return response.data;
}

export async function createListing(payload) {
  const response = await axiosClient.post("/listings", payload);
  return response.data;
}

export async function updateListing(id, payload) {
  const response = await axiosClient.put(`/listings/${id}`, payload);
  return response.data;
}

export async function deleteListing(id) {
  await axiosClient.delete(`/listings/${id}`);
}

export async function uploadListingImages(id, files) {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append("images", file);
  });

  const response = await axiosClient.post(`/listings/${id}/images`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
}

export async function deleteListingImage(id, imageId) {
  await axiosClient.delete(`/listings/${id}/images/${imageId}`);
}
