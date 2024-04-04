import { toggleSubscription ,getUserChannelSubscribers} from "../controllers/subscription.controller.js";
import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//route to toggle the subscription
router
  .route("/toggleSubscription/:channelId/:userId")
  .patch(/*verifyJWT,*/ toggleSubscription);

  //router to get the list of all the subscribers
  router.route( "/getAllSubscribers/:channelId").get(/*verifyJWT,*/ getUserChannelSubscribers)
export default router;
