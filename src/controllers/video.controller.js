import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { diskStorage } from "multer";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

//firstly we will write all the steps/functions we have to make
//1 retrieving/getting all videos or one
//2 uploading/Publishing a video
//3 get video by ID
//4 updating a video
//5 deleting a video
//6 toggle a video

const getAllVideos = asyncHandler(async (req, res) => {
  //as we are taking all the videos we have to filter them , apply sorting,pagination,searching,query and take all them from query
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  //we have to create empty objects so that according to our query we can they can work properly
  let filter = {};
  // If you want to perform text search filtering, you can use regular expressions or case-insensitive matching:
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  //if we want to filter based on userId then
  if (userId) {
    filter.userId = userId;
  }
  //now we work on sortBy and sortType and for this same as filter we will create a object
  let sortOptions = {};
  if (sortBy) {
    sortOptions[sortBy] = sortType === "desc" ? -1 : 1;
  }

  //now we will focus on pagination as how many page we want to display in one page and the skip of previous!!
  // let options = {

  // } now we will directly use pagination while finding video

  const video = await Video.find(filter)
    .sort(sortOptions)
    .skip((page - 1) * limit)
    .limit(limit);

  //if there is no video than
  if (!video) {
    throw new ApiError(404, "There is no video uploaded by this user");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, video, "Videos fetched Successfully"));
});

//uploadin or publishing a video
const publishVideo = asyncHandler(async (req, res) => {
  //now we will take the title and description of video from req.body
  const { title, description, duration } = req.body;

  //if we cannot get the title and description so we can use a if block to throw a error!!
  if (!(title && description)) {
    throw new ApiError(400, "title and description is required");
  }

  // Check if user is authenticated (JWT verification)
  if (!req.user) {
    throw new ApiError(401, "Unauthorized - Missing or invalid token");
  }

  //take video and thumbnail path from req.files
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

  //check if the video is not uploaded due to some reasons!!
  if (!uploadedThumbnail) {
    throw new ApiError(
      404,
      "something error occured while uploading the thumbnail on cloudinary"
    );
  }

  //now we will create a video file in db by using the Video model exported!!
  const video = await Video.create({
    title,
    description,
    duration,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    owner: req.user?._id,
  });
  //console.log(video)

  //now its time to return the api response!!
  return res
    .status(200)
    .json(new ApiResponse(201, video, "Video Uploaded Successfully!!"));
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

  //now take the details which we have to update!!
  const { description, title, thumbnail } = req.body;

  //check if id is valid or not !!
  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "provided video id for update is invalid!!");
  }

  //find video by mongoose methods!!
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      title,
      description,
      thumbnail,
    },
    { new: true }
  ); //in findByIdAndUpdate, old value is returned so to get new values we use new :true , keyword

  if (!updatedVideo) {
    throw new ApiError(404, "video to be updated not found!!");
  }

  //return the response!!
  return res
    .status(201)
    .json(new ApiResponse(200, video, "Video Updated Successfully!!"));
});

//5 Now we will delete a video by its id!!
const deleteVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(404, "Please Provide a Valid Id");
  }

  const deletedVideo = await Video.findOneAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(404, "video to be deleted not found!!");
  }

  return res
    .status(200)
    .json(new ApiResponse(201, null, "Video Deleted Successfully!!"));
});

//6  Now we will toggle a video!!
const togglePublishVideo = asyncHandler( async(req,res) => {
  const { videoId } = req.params;

  if(!isValidObjectId(videoId)){
    throw new ApiError(404, "Provided Id is not valid!!");
  }

  //find video
  const video = await Video.findById(videoId);

  if(!video){
    throw new ApiError(404,"video to be toggled not found!!")
  }

  video.isPublished = !video.isPublished;
  await video.save();


  return res
  .status(201)
  .json(new ApiResponse(200, video, "Published video toggled successfully!!"))
})
//export all functions
export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideoById,
  deleteVideoById,
  togglePublishVideo
};
