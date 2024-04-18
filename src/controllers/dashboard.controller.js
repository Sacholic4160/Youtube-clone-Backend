import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { Video } from "../models/video.model.js";

//getting user channel all videos
const getChannelVideos = asyncHandler(async (req, res) => {
  //here we will retrieve the user from refreshToken
  const user = await User.findOne({
    refreshToken: req?.cookies?.refreshToken,
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const videos = await Video.find({ owner: user?._id });
  if (!videos || videos.length === 0) {
    throw new ApiError(500, "Error while fetching the videos");
  }

  //count the no. of videos of this channel
  const countVideos = await Video.countDocuments({
    owner:user?._id
  })

  return res
    .status(200)
    .json(new ApiResponse(200, {countVideos,videos}, "Videos fetched successfully"));
});

const getChannelStats = asyncHandler(async (req, res) => {
  // Get the number of subscribers and videos, likes for a given channel
  const user = await User.findOne({
    refreshToken: req?.cookies?.refreshToken,
  });
  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  //total video views
  const totalVideoViews = await Video.aggregate([
    {
      $match: {
        owner: user?._id,
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: "$views",
        },
      },
    },
  ]);

  //total like
  const totalLikes = await Like.countDocuments({
    likedBy: user?._id,
  });

  //total videos
  const totalVideos = await Video.countDocuments({
    owner: user?._id,
  });

  //total subcribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: user?._id,
  });

  //returning response
  return res.status(200).json(
    new ApiResponse(200, {
      totalVideoViews: totalVideoViews[0]?.totalViews || 0,
      totalLikes,
      totalSubscribers,
      totalVideos,
    })
  );
});

export { getChannelVideos, getChannelStats };
