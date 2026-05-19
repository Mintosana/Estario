import {
  addListingImages,
  createListing,
  deleteListing,
  getListingById,
  getMyListingAnalytics,
  getMyListings,
  getPublicListings,
  removeListingImage,
  reorderListingImages,
  updateListing
} from "../services/listing.service.js";
import { generateListingDescription } from "../services/listingDescription.service.js";
import { interpretListingSearch } from "../services/naturalListingSearch.service.js";
import { reviewListingQuality } from "../services/listingQuality.service.js";

export async function listPublicListings(req, res) {
  const result = await getPublicListings(req.validated.query);
  res.json(result);
}

export async function interpretListingSearchAction(req, res) {
  const result = await interpretListingSearch(req.validated.body.query);
  res.json({ data: result });
}

export async function reviewListingQualityAction(req, res) {
  const result = await reviewListingQuality(req.validated.body, req.user);
  res.json({ data: result });
}

export async function generateListingDescriptionAction(req, res) {
  const result = await generateListingDescription(req.validated.body);
  res.json({ data: result });
}

export async function showListing(req, res) {
  const listing = await getListingById(req.validated.params.id, req.user);
  res.json({ data: listing });
}

export async function listMyListings(req, res) {
  const listings = await getMyListings(req.user.id);
  res.json({ data: listings });
}

export async function showMyListingAnalytics(req, res) {
  const analytics = await getMyListingAnalytics(req.user.id);
  res.json({ data: analytics });
}

export async function storeListing(req, res) {
  const listing = await createListing(req.user.id, req.validated.body);
  res.status(201).json({ data: listing });
}

export async function editListing(req, res) {
  const listing = await updateListing(req.validated.params.id, req.user, req.validated.body);
  res.json({ data: listing });
}

export async function destroyListing(req, res) {
  await deleteListing(req.validated.params.id, req.user);
  res.status(204).send();
}

export async function uploadListingImages(req, res) {
  const listing = await addListingImages(req.validated.params.id, req.user, req.files);
  res.status(201).json({ data: listing });
}

export async function destroyListingImage(req, res) {
  const listing = await removeListingImage(req.validated.params.id, req.validated.params.imageId, req.user);
  res.json({ data: listing });
}

export async function updateListingImageOrder(req, res) {
  const listing = await reorderListingImages(
    req.validated.params.id,
    req.user,
    req.validated.body.imageIds
  );
  res.json({ data: listing });
}
