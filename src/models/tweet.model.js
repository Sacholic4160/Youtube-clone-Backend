import { User } from "./user.model.js";
import mongoose, { Mongoose, Schema } from "mongoose";

const tweetSchema = new Schema(
  {
    contentTweet: {
      type: String,
      required: true,
    },
    tweetBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Tweet = mongoose.model("Tweet", tweetSchema);
