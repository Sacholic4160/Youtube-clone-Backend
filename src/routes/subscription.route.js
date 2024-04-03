import { toggleSubscription } from "../controllers/subscription.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//route to toggle the subscription
router
  .route("/toggleSubscription/:channelId")
  .patch(verifyJWT, toggleSubscription);

export default router;
