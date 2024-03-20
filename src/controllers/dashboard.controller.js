import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"; 
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const getChannelStats = asyncHandler(async(req,res) => {
    const { channel } = req.params;
    // Get the number of subscribers and videos, likes for a given channel
    
    
    
})
