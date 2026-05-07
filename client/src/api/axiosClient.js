import axios from "axios";

export const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";
export const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

export const axiosClient = axios.create({
  baseURL: apiBaseUrl
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("estario_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getApiErrorMessage(error) {
  return error.response?.data?.message ?? "A aparut o eroare. Incearca din nou.";
}

export function resolveApiAssetUrl(url) {
  if (!url || /^https?:\/\//i.test(url)) {
    return url;
  }

  return `${apiOrigin}${url}`;
}
