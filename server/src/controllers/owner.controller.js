import { getPublicOwnerProfile } from "../services/owner.service.js";

export async function showOwnerProfile(req, res) {
  const profile = await getPublicOwnerProfile(req.validated.params.id);
  res.json({ data: profile });
}
