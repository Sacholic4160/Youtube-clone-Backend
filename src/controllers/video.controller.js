import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { diskStorage } from "multer";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";

//firstly we will write all the steps/functions we have to make
//1 retrieving/getting all videos or one
//2 uploading/Publishing a video
//3 get video by ID
//4 updating a video
//5 deleting a video
//6 toggle a video

//uploadin or publishing a video
const publishVideo = asyncHandler(async (req, res) => {
  //now we will take the title and description of video from req.body
  const { title, description } = req.body;

  //if we cannot get the title and description so we can use a if block to throw a error!!
  if (!(title && description)) {
    throw new ApiError(400, "title and description is required");
  }

  // Check if user is authenticated (JWT verification)
  if (!req.user) {
    throw new ApiError(401, "Unauthorized - Missing or invalid token");
  }

  //take video and thumbnail path from req.files
  // console.log(req.files);
  // console.log(req.files.videoFile)
  // console.log(req.files.videoFile[0])
  // console.log(req.files.videoFile.path)
  // console.log(req.files.videoFile[0].path)
  // console.log(req.files.thumbnail)
  // console.log(req.files.thumbnail[0])
  // console.log(req.files.thumbnail.path)
  // console.log(req.files.thumbnail[0].path)
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  //checking if the path of these files are retrieved or not
  if (!(videoLocalPath && thumbnailLocalPath)) {
    throw new ApiError(
      404,
      "there is some error while fetching the path of videoFile OR thumbnail"
    );
  }
  // console.log(req.files);
  // console.log(videoLocalPath,thumbnailLocalPath);
  //uploading videofile and thumbnail  on cloudinary!!
  const uploadedVideo = await uploadOnCloudinary(videoLocalPath);

  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  //console.log(uploadedVideo ,uploadedThumbnail);

  //check if the video is not uploaded due to some reasons!!

  if (!(uploadedVideo && uploadedThumbnail)) {
    throw new ApiError(
      404,
      "something error occured while uploading the video OR thumbnail on cloudinary"
    );
  }

  console.log("Video and thumbnail uploaded on cloudinary");

  //check if the video is not uploaded due to some reasons!!
  // if (!uploadedThumbnail) {
  //   throw new ApiError(
  //     404,
  //     "something error occured while uploading the thumbnail on cloudinary"
  //   );
  // }
  //getting the user
  const user = await User.findById(req.user?._id);

  //now we will create a video file in db by using the Video model exported!!
  const video = await Video.create({
    title,
    description,
    duration: uploadedVideo.duration,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    owner: user._id,
  });
  //console.log(video)

  //now its time to return the api response!!
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Uploaded Successfully!!"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  //as we are taking all the videos we have to filter them , apply sorting,pagination,searching,query and take all them from query
  const { page = 1, limit = 10, query, sortBy, sortType } = req.query;

  // //we have to create empty objects so that according to our query we can they can work properly
  // let filter = {};
  // // If you want to perform text search filtering, you can use regular expressions or case-insensitive matching:
  // if (query) {
  //   filter.title = { $regex: query, $options: "i" };
  // }

  // //if we want to filter based on userId then
  // if (userId) {
  //   filter.userId = userId;
  // }
  // //now we work on sortBy and sortType and for this same as filter we will create a object
  // let sortOptions = {};
  // if (sortBy) {
  //   sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  // }

  //now we will focus on pagination as how many page we want to display in one page and the skip of previous!!
  // let options = {

  // } now we will directly use pagination while finding video

  // Check if query is a non-empty string
  if (typeof query !== "string" || query.trim() === "") {
    return res
      .status(400)
      .json(new ApiResponse(400, "Invalid query parameter"));
  }

  //get the user from cookies
  const user = await User.find({ refreshToken: req.cookies?.refreshToken });

  //parse the page and limiting and skip
  const pageNumber = parseInt(page);
  const limitOfComments = parseInt(limit);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //take the skip and page size
  const skip = (pageNumber - 1) * limitOfComments;
  const pageSize = limitOfComments;

  //now we integrate pipeline of Video and likes
  const videos = await Video.aggregatePaginate(
    Video.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
          isPublished: true,
          owner: user?._id,
        },
      },
      {
        $lookup: {
          from: "Like",
          localField: "_id",
          foreignField: "video",
          as: "likes",
        },
      },
      //  {
      //   $lookup: {
      //     from: "Comment",
      //     localField: "_id",
      //     foreignField: "video",
      //     as: "comments",
      //   }
      //  },
      {
        $addFields: {
          likes: { $size: "$likes" },
          //  comments: {$size: "$comments" },
        },
      },
      {
        $project: {
          _id: 1,
          videoFile: 1,
          thumbnail: 1,
          title: 1,
          description: 1,
          duration: 1,
          views: 1,
          isPublished: 1,
          owner: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          // comments: 1,
        },
      },
      { $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } },
      { $skip: skip },
      { $limit: pageSize },
    ])
  );

  // const video = await Video.find(filter)
  //   .sort(sortOptions)
  //   .skip((page - 1) * limit)
  //   .limit(limit);

  //if there is no video than
  if (videos.length === 0) {
    return res.status(200).json(new ApiResponse(200, "No videos available."));
  }

  return res
    .status(200)
    .json(new ApiResponse(201, videos, "videos fetched Successfully"));
});

//3 now we have to get the video by its ID we have uploaded!!
const getVideoById = asyncHandler(async (req, res) => {
  //getting video from req.params by id as it is a specified valua that's why we are using req.params!!
  const { videoId } = req.params;

  //cheching if video id is provided or not (and if provided it is correct or not)!!
  if (!isValidObjectId(videoId)) {
    //isValidObjectId is used to check if provided id is valid or not!!
    throw new ApiError(404, "videoId provided is invalid!!");
  }

  //find video using the Video db model
  const video = await Video.findById(videoId);

  //checking if video founded is valid or not !!
  if (!video) {
    throw new ApiError(404, "video not found!!");
  }

  //return the response
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        video,
        "video fetched successfully using provided ID"
      )
    );
});

//4.  Now we will update an existing video by id
const updateVideoById = asyncHandler(async (req, res) => {
  //taking video id from req.params as the user is specifying it in its query and its only one thats why we used it!!
  const { videoId } = req.params;
  //check if id is valid or not !!
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "provided video id for update is invalid!!");
  }
  //only the owner can update the video so we have to get both details
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found!");
  }

  //get the  user from cookies!!
  const user = await User.find({
    refreshToken: req.cookies?.refreshToken,
  });

  if (!user) {
    throw new ApiError(400, "user not found !!");
  }

  //check if the user is owner of this video or not
  if (!video.owner.equals(user._id.toString())) {
    throw new ApiError(403, "only the owner can update the video!!");
  }
  // Update title and description
  const { title, description } = req.body;
  if (!title) {
    throw new ApiError(400, "Title is required");
  }
  if (!description) {
    throw new ApiError(400, "Description is required");
  }
  video.title = title;
  video.description = description;

  // Update thumbnail
  const newThumbnailLocalFilePath = req.file?.path;
  if (!newThumbnailLocalFilePath) {
    throw new ApiError(400, "Thumbnail is not uploaded");
  }
  const thumbnail = await uploadOnCloudinary(newThumbnailLocalFilePath);
  if (!thumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail to Cloudinary");
  }
  video.thumbnail = thumbnail.url;

  // Save the changes
  await video.save();

  // Return the response
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated successfully"));
});

//5 Now we will delete a video by its id!!
const deleteVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "videoId cant be fetched from params");
  }

  const video = await Video.findById(videoId);
  const user = await User.findOne({
    refreshToken: req.cookies.refreshToken,
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  //only the owner can delete the video
  if (video?.owner.equals(user._id.toString())) {
    await Video.findByIdAndDelete(videoId);
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Video deleted successfully"));
  } else {
    throw new ApiError(401, "Only user can delete the video");
  }
});

//6  Now we will toggle a video!!
const togglePublishVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Provided Id is not valid!!");
  }

  //find video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "video to be toggled not found!!");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(
      new ApiResponse(200, video, "Published video toggled successfully!!")
    );
});
//export all functions
export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideoById,
  deleteVideoById,
  togglePublishVideo,
};
