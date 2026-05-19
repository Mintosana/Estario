import { buyPromotionBundle, sponsorListing } from "../services/promotion.service.js";

export async function buyPromotionBundleAction(req, res) {
  const result = await buyPromotionBundle(req.user.id, req.validated.body.bundleKey);
  res.json(result);
}

export async function sponsorListingAction(req, res) {
  const result = await sponsorListing(req.validated.params.id, req.user.id);
  res.json(result);
}
