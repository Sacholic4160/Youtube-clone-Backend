import {
  toggleSubscription,
  getUserChannelSubscribers,
  getUserSubscribedChannels,
} from "../controllers/subscription.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//all the routes will use verify jwt middleware
router.use(verifyJWT);
//route to toggle the subscription
router
  .route("/c/:channelId")
  .get(getUserChannelSubscribers)
  .post(toggleSubscription);

//router to get the list of all the subscribers
router.route("/u/:subscriberId").get(getUserSubscribedChannels);
export default router;
