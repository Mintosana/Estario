import { getPointsOfInterest } from "../services/poi.service.js";

export async function listPointsOfInterest(req, res) {
  const points = await getPointsOfInterest(req.validated.query);
  res.json({ data: points });
}
