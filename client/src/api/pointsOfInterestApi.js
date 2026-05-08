import { axiosClient } from "./axiosClient.js";

export async function getPointsOfInterest(bounds, categories) {
  const params = {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
    categories: categories.join(",")
  };
  const response = await axiosClient.get("/points-of-interest", { params });
  return response.data;
}
