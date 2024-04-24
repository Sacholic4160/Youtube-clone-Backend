import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {
  //take content of tweet from req.body and user from refreshToken
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  console.log(content);

  //take user
  const user = await User.findOne({
    refreshToken: req?.cookies?.refreshToken,
  });
  if (!user) {
    throw new ApiError(404, "User not found!!");
  }

  //create instance
  const tweet = await Tweet.create({
    content,
    owner: user?._id,
  });

  return res.status(200).json(200, tweet, "tweet created successfully!!");
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    throw new ApiError(400, "userId not found!!");
  }

  const tweets = await Tweet.findById({ owner: userId });

  return res
    .status(200)
    .json(200, tweets, "user tweets fetched successfully!!");
});

const updateTweet = asyncHandler(async (req, res) => {
  //take content of tweet from req.body and user from refreshToken
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweetId is required!");
  }

  const user = await User.findOne({
    refreshToken: req?.cookies?.refreshToken,
  });
  if (!user) {
    throw new ApiError(400, "user is not found!");
  }

  const tweet = await Tweet.findById({ tweetId });
  if (!tweet) {
    throw new ApiError(400, "tweet not found!!");
  }

  if (tweet.owner.equals(user._id.toString())) {
    const { content } = req.body;
    if (!content) {
      throw new ApiError(400, "content is required!");
    }

    tweet.content = content;
    await tweet.save({ validateBeforeSave: false });

    return res.status(200).json(200, tweet, "tweer updated successfully!");
  } else {
    throw new ApiError(400, "only the user can update the tweet!");
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!tweetId) {
    throw new ApiError(400, "Tweet id cant be fetched for params");
  }
  const tweet = await Tweet.findById(tweetId);
  const user = await User.findOne({
    refreshToken: req.cookies.refreshToken,
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //only the owner can delete the tweet
  if (tweet?.owner.equals(user._id.toString())) {
    await Tweet.findByIdAndDelete(tweetId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
  } else {
    throw new ApiError(401, "Only user can delete the tweet");
  }
});
export { createTweet, updateTweet, getUserTweets, deleteTweet };
