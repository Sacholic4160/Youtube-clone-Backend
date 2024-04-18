import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";


const toggleSubscription = asyncHandler(async (req, res) => {
  const {channelId} = req.params
  if(!isValidObjectId(channelId)){
      throw new ApiError(400,"Cannot find the channel")
  }

  const channel=await User.findById(channelId) //channel is also user
  if(!channel){
      throw new ApiError(404,"Channel does not exist")
  }

  const user = await User.findOne({
      refreshToken: req.cookies.refreshToken,
  })
  if (!user) {
      throw new ApiError(404, "Subscriber not found")
  }


  const userSub=await Subscription.findOne({
      subscriber: user._id,
      channel: channelId,
  });

  //if user is subscribed- unsubscribe 
  if(userSub){
      const unsubscribe= await Subscription.findOneAndDelete(
          {
              subscriber: user._id,
              channel: channel._id
          }
      )

      if (!unsubscribe) {
          throw new ApiError(500, "Something went wrong while unsubscribing ");
      }

      return(
          res
          .status(200)
          .json(new ApiResponse(200,unsubscribe,"User unsubscribed"))
      )
  }

  //else subscribe the channel
  if(!userSub){
      const subscribe=await Subscription.create(
          {
              subscriber: user._id,
              channel: channel._id
          }
      )
      if (!subscribe) {
          throw new ApiError(500,"Error while subscribing the channel")
      }
      return(
          res
          .status(200)
          .json(new ApiResponse(200,subscribe,"User subscribed"))
      )
      
  }
})

//get all the subscribers list for a specific channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const {channelId} = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(404, "Invalid Channel ID!");
  }

  //find channel using User because channel is also an user
  const channel = await User.findById(channelId)
  if (!channel) {
    throw new ApiError(404, "channel with specified id does not exist!!");
  }
  console.log(channel);
     
  //get subscribers
  const subscribers = await Subscription.find({
    channel:channel?._id
  }).populate("subscriber")
  console.log(subscribers)

  //count the documents name subscriber
  const countSubscriber = await Subscription.countDocuments({
    channel:channelId
  })
console.log(countSubscriber)

  //returning the response
  return(
    res
    .status(200)
    .json(new ApiResponse(200,{countSubscriber,subscribers},"Subscribers retrieved successfully"))
)
});

//get all the channels to which user had subscribed
const getUserSubscribedChannels = asyncHandler(async(req,res) => {
  const {subscriberId} = req.params;

   if(!isValidObjectId(subscriberId)){
    throw new ApiError(401,"Invalid subscriber ID!")
   }

   const subscriptions = await Subscription.find({
    subscriber:subscriberId
   }).populate("channel")

   const  countSubscriptions = await Subscription.countDocuments({
    subscriber:subscriberId
   })

   return(
    res
    .status(200)
    .json(new ApiResponse(200,{countSubscriptions,subscriptions},"Subscribed channels fetched successfully"))
)
})
export { toggleSubscription, getUserChannelSubscribers,getUserSubscribedChannels };
