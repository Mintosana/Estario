import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import favoriteRoutes from "./favorite.routes.js";
import listingRoutes from "./listing.routes.js";
import messageRoutes from "./message.routes.js";
import savedSearchRoutes from "./savedSearch.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    name: "Estario API",
    message: "API initializata. Rutele functionale vor fi adaugate incremental."
  });
});

router.use("/auth", authRoutes);
router.use("/", listingRoutes);
router.use("/", favoriteRoutes);
router.use("/", messageRoutes);
router.use("/", savedSearchRoutes);
router.use("/", adminRoutes);

export default router;
