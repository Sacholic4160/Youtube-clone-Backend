import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../modes/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "We are going in right direction",
  });

  //steps to register a user
  //1 get user details from frontend
  //2 validation - if something they sent is empty
  //3 check if user already exist : username, email
  //4 check for images ,check for avatar (multer has uploaded on server or not)
  //5 upload them to cloudinary ,(avatar ,profileimg)
  //6 create user object to upload data in mongodb
  //7 remove password and refresh token field from response
  //8 check for user creation
  //9 return response

  //1 getting user from frontend(but now postman)

  const { fullName, email, password, userName } = req.body;  //in req.body we can find all the details regarding our project
  console.log("email: ",email);

  //2 checking validation 

  if(
    [fullName,email,password,userName].some((field) =>  field?.trim() === "")
  )
{
  throw new ApiError(400, "All fields are required");
}

//3 check if user already exist or not
//here we can use if else statements to check but there is an advanced method to check 

const existedUser = await User.findOne(
{
  $or : [{ userName },{ email }]
}
)
if(existedUser) {
  throw new ApiError(400, "user with this email already exist");
}

//4 checking for images ,avatar, coverImage (local disk -> server(via multer) -> cloudinary)
//for files to upload we have to use req.files instead of req.body
const avatarLocalPath = req.files?.avatar[0]?.path; //here we have to extract the first property of avatar so wee used it as an array to get its path
const coverImagePath = req.files?.coverImage[0]?.path;

//check if avatar exist or not
if(!avatarLocalPath){
  throw new ApiError(404, "avatar is required")
} 

//chech if coverImage exist or not
if(!coverImageLocalPath){
  throw new ApiError(404, "coverImage  is required")
}

//uploading the avatar and coverImage file on cloudinary
const avatar = uploadOnCloudinary(avatarLocalPath);
const coverImage = uploadOnCloudinary(coverImageLocalPath);

//checking if files uploaded on cloudinary or not
if(!avatar){
  throw new ApiError(404 , "Problem in uploading the avatar file on cloudinary");
}
if(!coverImage){
  throw new ApiError(404 , "Problem in uploading the coverImage file on cloudinary");
}

//create a user object so that we can save all the data in our mongodb database

const user = await User.create({
  fullName,
  userName: userName,
  email,
  password,
  avatar: avatar.url,   //here we are taking url of avatar instead of using a file because with url we can access it thru cloudinary
  coverImage : coverImage.url || "",
})
 
//after creating the user we have to remove the password and refreshToken

const createdUser = await User.findById(user._id).select("-password -refreshToken")

//check if user is created or not
if(!createdUser){
  throw new ApiError(500, "There is some error while creating the object");
}

// after finishing all the steps now finally we have to return our response 

return res.status(201).json(
   new ApiResponse(200, createdUser,"User Registered Successfully")
)


});

export { registerUser };
