import {
  createSavedSearch,
  deleteSavedSearch,
  getSavedSearches,
  updateSavedSearch
} from "../services/savedSearch.service.js";

export async function listSavedSearches(req, res) {
  const savedSearches = await getSavedSearches(req.user.id);
  res.json({ data: savedSearches });
}

export async function storeSavedSearch(req, res) {
  const savedSearch = await createSavedSearch(req.user.id, req.validated.body);
  res.status(201).json({ data: savedSearch });
}

export async function editSavedSearch(req, res) {
  const savedSearch = await updateSavedSearch(
    req.validated.params.id,
    req.user.id,
    req.validated.body
  );
  res.json({ data: savedSearch });
}

export async function destroySavedSearch(req, res) {
  await deleteSavedSearch(req.validated.params.id, req.user.id);
  res.status(204).send();
}
