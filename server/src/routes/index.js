import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import authRoutes from "./auth.routes.js";
import favoriteRoutes from "./favorite.routes.js";
import listingRoutes from "./listing.routes.js";
import messageRoutes from "./message.routes.js";
import notificationRoutes from "./notification.routes.js";
import ownerRoutes from "./owner.routes.js";
import poiRoutes from "./poi.routes.js";
import promotionRoutes from "./promotion.routes.js";
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
router.use("/", notificationRoutes);
router.use("/", ownerRoutes);
router.use("/", poiRoutes);
router.use("/", promotionRoutes);
router.use("/", savedSearchRoutes);
router.use("/", adminRoutes);

export default router;
