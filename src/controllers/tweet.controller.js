import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createTweet = asyncHandler(async (req, res) => {

  //take content of tweet from req.body and user from refreshToken
  const { content } = req.body;
  if(!content){
    throw new ApiError(400,"Content is required")
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
    content ,
    owner :user?._id

  })

  return res
  .status(200)
  .json(200,tweet,"tweet created successfully!!")

});


export {createTweet}
