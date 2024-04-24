import express from "express";
const router = express.Router();
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.use(verifyJWT);
//route to post a tweet
router.route("/create-tweet").post(createTweet);
//route to get all tweets
router.route("/get-tweets/:userId").get(getUserTweets);
//router to update a tweet
router.route("/update-tweet/:tweetId").patch(updateTweet);
//router to delete a tweet
router.route("/delete-tweet/:tweetId").delete(deleteTweet);

export default router;
