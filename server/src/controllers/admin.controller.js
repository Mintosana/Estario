import {
  approveListing,
  getPendingListings,
  getRejectedListings,
  rejectListing
} from "../services/admin.service.js";

export async function listPendingListings(req, res) {
  const listings = await getPendingListings();
  res.json({ data: listings });
}

export async function listRejectedListings(req, res) {
  const listings = await getRejectedListings();
  res.json({ data: listings });
}

export async function approveListingAction(req, res) {
  const listing = await approveListing(req.validated.params.id);
  res.json({ data: listing });
}

export async function rejectListingAction(req, res) {
  const listing = await rejectListing(req.validated.params.id, req.validated.body.reason);
  res.json({ data: listing });
}
