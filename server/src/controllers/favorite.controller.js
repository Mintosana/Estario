import {
  addFavorite,
  getFavorites,
  removeFavorite
} from "../services/favorite.service.js";

export async function listFavorites(req, res) {
  const favorites = await getFavorites(req.user.id);
  res.json({ data: favorites });
}

export async function storeFavorite(req, res) {
  await addFavorite(req.user.id, req.validated.params.listingId);
  res.status(201).json({ message: "Anuntul a fost adaugat la favorite.", errors: [] });
}

export async function destroyFavorite(req, res) {
  await removeFavorite(req.user.id, req.validated.params.listingId);
  res.status(204).send();
}
