import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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

  const { fullName, email, password, userName } = req.body; //in req.body we can find all the details regarding our project
  console.log("email: ", email);

  //2 checking validation

  if (
    [fullName, email, password, userName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //3 check if user already exist or not
  //here we can use if else statements to check but there is an advanced method to check

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existedUser) {
    throw new ApiError(400, "user with this email already exist");
  }

  //4 checking for images ,avatar, coverImage (local disk -> server(via multer) -> cloudinary)
  //for files to upload we have to use req.files instead of req.body
  const avatarLocalPath = req.files?.avatar[0]?.path; //here we have to extract the first property of avatar so wee used it as an array to get its path
  // const coverImagePath = req.files?.coverImage[0]?.path;

  //check if coverImage exist or not
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  //check if avatar exist or not
  if (!avatarLocalPath) {
    throw new ApiError(404, "avatar is required");
  }

  //chech if coverImage exist or not
  // if(!coverImageLocalPath){
  //   throw new ApiError(404, "coverImage  is required")
  // }

  //uploading the avatar and coverImage file on cloudinary
  const avatar = uploadOnCloudinary(avatarLocalPath);
  const coverImage = uploadOnCloudinary(coverImageLocalPath);

  //checking if files uploaded on cloudinary or not
  if (!avatar) {
    throw new ApiError(
      404,
      "Problem in uploading the avatar file on cloudinary"
    );
  }
  if (!coverImage) {
    throw new ApiError(
      404,
      "Problem in uploading the coverImage file on cloudinary"
    );
  }

  //create a user object so that we can save all the data in our mongodb database

  const user = await User.create({
    fullName,
    userName: userName,
    email,
    password,
    avatar: avatar.url, //here we are taking url of avatar instead of using a file because with url we can access it thru cloudinary
    coverImage: coverImage.url || "",
  });

  //after creating the user we have to remove the password and refreshToken

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check if user is created or not
  if (!createdUser) {
    throw new ApiError(500, "There is some error while creating the object");
  }

  // after finishing all the steps now finally we have to return our response

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Registered Successfully"));
});

//login user algorithms and what are the steps we use :-
//1 take data from req.body
//2 check userName or email exist or not or correct or not
//3 check for password if correct or not
//4 generate access or refresh token
//5 send tokens using cookies

//4  using separate method to generate access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    //we have designed a refresh tekon in our db schema so we have to save it there!
    user.refreshToken = refreshToken;
    // we have updated our user so now we have to save it in db

    await user.save({ validateBeforeSave: false }); //validatebeforesave means that if db wants some validation on tokens then it save with out it!

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(401, "something went wrong while generating the access and refresh tokens!");
  }
};
//1 making a wrap by a fxn loginuser with the help of asynchandler and taking user details from body using req.body
const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  console.log(userName, email);

  //2   checking if email or username is valid or correct or not as per rules
  if (!(email || userName)) {
    throw new ApiError(404, "userName and email required");
  }

  //3   checking if user is already a registered user
  const user = User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist , please sign up!");
  }

  //4 checking password is correct according to the bcrypt as it hashed it
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "password is wrong ");
  }

  // Generating access and refresh tokens using a method out side this fxn

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  //creating a variable named loggedinuser so that we can send the details to user without of password and refresh token

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


  //5  sending tokens using cookies and creting its options sending data thru json response!

  const options = {
    httpOnly : true,
    secure : true,
  }


  return res
  .status(200)
  .cookie("accessToken", accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(201,{
      loggedInUser,accessToken,refreshToken
    },
    "User Logged In Successfully!!")
  )
});



//now creating the method for logout a user !!

const loggedOutUser = asyncHandler( async (req, res)=> {

  //using findbyidandupdate we can directly find and update at the same time by using a (new ) keyword to return the new value!!
await User.findByIdAndUpdate(
  req.user._id,
  {
    // refreshToken : undefined
    $unset:  {
      refreshToken:1,
    }
  },
  {
    new :true
  },

)
options={
  httpOnly:true,
  secure:true
}
//here we send response by clearing the cookies !!

return res
.status(200)
.clearCookie("accessToken",options)
.clearCookie("refreshToken",options).
json(new ApiResponse(
  201,
  {},
  "user logged out successfully"
))


})

//now here we will refresh our access and refresh tokens as for easy signing in !!

//1   take the incoming refresh token from user/cookie/body

const refreshAccessToken = asyncHandler ( async (req,res) => {
  const incomingRefreshToken = req.cookie?.refreshToken || req.body.refreshToken;

  //check if the refresh token given by user is valid or not!!
  if(!incomingRefreshToken){
    throw new ApiError(404, "unauthorised Token!!");
  }
  //now we will verify the refresh token of given user with the token(secret) stored in database!!

  try {
    
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    //now create a user instance by finding the user from db using this decodedtoken and with its id!!
  const user = await User.findById(decodedToken?._id);

  //check for user is valid , correct or not!!
  if(!user){
    throw new ApiError(401, "invalid refresh token!!")
  }

  //now check or verify that the user provided refresh token is similar to the token that is stored in db then only we can give acces

  if(incomingRefreshToken !== user?.refreshToken){
    throw new ApiError(404, "Refresh token provided is not matching!!")
  }

  //now if they both match then generate our tokens so that user can log in again

  const { accessToken , newRefreshToken} = generateAccessAndRefreshTokens(user?._id)

  options ={
    httpOnly: true,
    secure : true,
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",newRefreshToken,options)
  .json(
    new ApiResponse(201,{accessToken,refreshToken :newRefreshToken },
  "Access Token Refreshed Successfully"
)
  )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token refreshment!!")
  }
})

export { registerUser, loginUser ,loggedOutUser , refreshAccessToken};
