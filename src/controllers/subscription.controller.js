import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  try {
    //const _id = req.params.channelId;
    const { channelId, userId } = req.params;
    console.log(`channelId : ${channelId} and  userId:${userId}`);

    //checking if channel id is valid or not!!
    if (!isValidObjectId(channelId)) {
      throw new ApiError(404, "Invalid Channel ID");
    }
    //checking if user id is valid or not!!
    if (!isValidObjectId(userId)) {
      throw new ApiError(404, "Invalid user ID");
    }
    //checking if the user is not subscribing from its own channel!!
    if (channelId == userId) {
      throw new ApiError(400, "You cannot subscribe to your own channel!");
    }
    // // Check if a user object exists directly in the req object
    // if (!req.user) {
    //   throw new ApiError(401, "Unauthorized request");
    // }
    // console.log(req.user);
    // const user = await User.findById(req.user?._id);
    // console.log(user);

    // if (!user) {
    //   throw new ApiError(400, "user not found of specified id!");
    // }

    //find the user if he subscribed to the channel or not!
    const subscription = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    });
    console.log(`data of subscription : ${subscription}`);
    let method = "";

    if (!subscription) {
      method = "create";
      const newSubscription = await Subscription.create({
        subscriber: userId,
        channel: channelId,
      });
      console.log(`data of new subscription : ${newSubscription}`);
      return res
        .status(201)
        .json(
          new ApiResponse(201, newSubscription, "Subscribed to the channel")
        );
    } else {
      method = "deleteOne";
      await Subscription.findByIdAndDelete(userId);
      return res
        .status(201)
        .json(new ApiResponse(201, null, "Unsubscribed Successfully!"));
    }
  } catch (error) {
    console.error(error);
    //return next(error);
  }
});

//get all the subscribers list for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const id = req.params.channelId;

  if (!isValidObjectId(id)) {
    throw new ApiError(404, "Invalid Channel ID!");
  }

  const channel = await Subscription.findById(id).populate("subscriber");

  if (!channel) {
    throw new ApiError(400, "channel with specified id does not exist!!");
  }
   
  let subscribers = {}
  subscribers = channel.subscriber;
  subscribers.select(["-password -refreshToken"]);

  return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "list fetched successfully!!"));
});
export { toggleSubscription, getUserChannelSubscribers };
