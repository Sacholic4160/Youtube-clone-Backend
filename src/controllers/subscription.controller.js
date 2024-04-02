import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose, { isValidObjectId } from "mongoose";

const toggleSubscription = asyncHandler(async (req, res) => {
  const  _id = req.params.channelId;


  //checking if channel id is valid or not!!
  if (!isValidObjectId(_id)) {
    throw new ApiError(404, "Invalid Channel ID");
  }
   

});
