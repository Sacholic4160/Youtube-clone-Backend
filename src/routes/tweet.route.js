import express from "express"
const router = express.Router();
import { createTweet } from "../controllers/tweet.controller.js";


//route to post a tweet 
router.route("/create-tweet").post(createTweet);


export default router;