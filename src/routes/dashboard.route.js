import express from "express";
const router = express.Router();
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelVideos,
  getChannelStats,
} from "../controllers/dashboard.controller.js";

router.use(verifyJWT);

//route for getting all videos of particular user
router.route("/get-all-videos").get(getChannelVideos);

//route for getting all stats of particular user's channel
router.route("/get-channel-stats").get(getChannelStats);



export default router;