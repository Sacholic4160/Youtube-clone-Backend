import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";

//get all comments of a video
const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if videoId is a valid ObjectId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const pageNumber = parseInt(page);
  const limitOfComments = parseInt(limit);

  // Find the video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Find comments for the video
  const comments = await Comment.aggregatePaginate(
    Comment.aggregate([
      {
        $match: {
          video: video._id,
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "comment",
          as: "likes",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "commentBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $addFields: {
          likes: {
            $size: "$likes",
          },
          isLiked: {
            $in: [req.user?.id, "$likes.likedBy"],
          },
          username: {
            $arrayElemAt: ["$user.username", 0],
          },
        },
      },
      {
        $project: {
          username: 1,
          content: 1,
          likes: 1,
          createdAt: 1,
          isLiked: 1,
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]),
    { page: pageNumber, limit: limitOfComments }
  );

  if (comments.length === 0) {
    throw new ApiError(400, "No comments on the video");
  }

  // Return the paginated comments
  return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// add  a comment
const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Check if videoId is a valid ObjectId
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "content is required!!");
  }
  const user = await User.findOne({
    refreshToken: req.cookies.refreshToken,
  });

  if (!user) {
    throw new ApiError(400, "user not found!!");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not found!!");
  }

  const comment = await Comment.create({
    content: content,
    user: user._id,
    video: video._id,
  });

  if (!comment) {
    throw new ApiError(400, "Error while creating the comment!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(comment, "comment added successfully!!"));
});

//update a comment
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  // Check if commentId is a valid ObjectId
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid video Id");
  }

  const user = await User.findOne({
    refreshToken: req.cookies.refreshToken,
  });

  if (!user) {
    throw new ApiError(400, "user not found!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not founnd of given id");
  }

  if (comment?.commentBy.equals(user._id.toString())) {
    const { content } = req.body;

    if (!content) {
      throw new ApiError(400, "content not found!");
    }
    comment.content = content;
    await comment.save({ validateBeforeSave: false });

    return res
      .status(201)
      .json(new ApiResponse("comment updated successfully!!", comment));
  } else {
    throw new ApiError(400, "only the owner can update the comment!");
  }
});

//delete a comment
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId ");
  }

  const user = await User.findOne({
    refreshToken: req.cookies.refreshToken,
  });

  if (!user) {
    throw new ApiError(400, "user not found!");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not found!!");
  }
  if (comment?.commentBy.equals(user._id.toString())) {
    await comment.remove();
    return res
      .status(201)
      .json(new ApiResponse("comment deleted successfully!!"));
  } else {
    throw new ApiError(400, "only owner can delete the comment!!");
  }
});

module.exports = {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
};
