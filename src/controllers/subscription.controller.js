import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    const _id = req.params.channelId;

    //checking if channel id is valid or not!!
    if (!isValidObjectId(_id)) {
      throw new ApiError(404, "Invalid Channel ID");
    }
    //checking if the user is not subscribing from its own channel!!
    if (channelId == req.user?._id) {
      throw new ApiError(400, "You cannot subscribe to your own channel!");
    }
    const user = await User.findById(req.user?._id);
    console.log(user);

    if (!user) {
      throw new ApiError(400, "user not found of specified id!");
    }

    //find the user if he subscribed to the channel or not!
    const subscription = await Subscription.findOne({
      subscriber: user._id,
      channel: _id,
    });
    let method = "";

    if (!subscription) {
      method = "create";
      const newSubscription = await Subscription.create({
        subscriber: user._id,
        channel: _id,
      });
      return res
        .status(201)
        .json(
          new ApiResponse(201, newSubscription, "Subscribed to the channel")
        );
    } else {
      method = "deleteOne";
      await subscription.remove();
      return res
        .status(201)
        .json(new ApiResponse(201, null, "Unsubscribed Successfully!"));
    }
  } catch (error) {
    console.error(error.message);
    return next(error);
  }
});

//get all the subscribers list for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const id = req.params.channelId;

  if (!isValidObjectId(id)) {
    throw new ApiError(404, "Invalid Channel ID!");
  }
  console.log("channelId: ", id)

  const 
});
export { toggleSubscription };
