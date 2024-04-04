import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
//import { v2 as cloudinary } from "cloudinary";

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
    throw new ApiError(
      500,
      "something went wrong while generating the access and refresh tokens!"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => { 
  // res.status(200).json({
  //   message: "We are going in right direction",
  // });

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

  // const existedUser = await User.findOne({
  //   $or: [{ userName }, { email }],
  // });
  let existedUserByEmail , existedUserByUserName;

  //checking db if this email already exist!
  existedUserByEmail = await User.findOne({email});
   if (existedUserByEmail) {
    throw new ApiError(400, "user with this email already exist");
  }

   //checking db if this username already exist!
   existedUserByUserName = await User.findOne({userName});
   if (existedUserByUserName) {
    throw new ApiError(400, "user with this userName already exist");
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
    throw new ApiError(404, "Avatar file is required");
  }

  //chech if coverImage exist or not
  // if(!coverImageLocalPath){
  //   throw new ApiError(404, "coverImage  is required")
  // }

  //uploading the avatar and coverImage file on cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  //checking if files uploaded on cloudinary or not
  if (!avatar) {
    throw new ApiError(
      400,
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
    coverImage: coverImage?.url || "",
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

//1 making a wrap by a fxn loginuser with the help of asynchandler and taking user details from body using req.body
const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  console.log(userName, email);

  //2   checking if email or username is valid or correct or not as per rules
  if (!email && !userName) {              //!(email || userName)
    throw new ApiError(404, "userName and email required");
  }

  //3   checking if user is already a registered user
  // 
  let user;

  // Checking if user exists based on email or userName
  if (email) {
    user = await User.findOne({ email });
  } else {
    user = await User.findOne({ userName });
  }
  //console.log(user);
  if (!user) {
    throw new ApiError(404, "User does not exist , please sign up!");
  }

  //4 checking password is correct according to the bcrypt as it hashed it
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "password is wrong ");
  }

  // Generating access and refresh tokens using a method out side this fxn

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //creating a variable named loggedinuser so that we can send the details to user without of password and refresh token

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //5  sending tokens using cookies and creting its options sending data thru json response!

  const options = {
    httpOnly: true,
    secure: true,
  };

  //checking if cookie is enabled or not?
  // const isCookieEnabled = navigator.cookieEnabled;
  //     console.log(isCookieEnabled);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        {
          loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully!!"
      )
    );
});

//now creating the method for logout a user !!

const loggedOutUser = asyncHandler(async (req, res) => {
  //using findbyidandupdate we can directly find and update at the same time by using a (new ) keyword to return the new value!!
  await User.findByIdAndUpdate(
    req.user._id,
    {
      // refreshToken : undefined
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  options = {
    httpOnly: true,
    secure: true,
  };
  //here we send response by clearing the cookies !!

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "user logged out successfully"));
});

//now here we will refresh our access and refresh tokens as for easy signing in !!

//1   take the incoming refresh token from user/cookie/body

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookie?.refreshToken || req.body.refreshToken;

  //check if the refresh token given by user is valid or not!!
  if (!incomingRefreshToken) {
    throw new ApiError(404, "unauthorised Token!!");
  }
  //now we will verify the refresh token of given user with the token(secret) stored in database!!

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    //now create a user instance by finding the user from db using this decodedtoken and with its id!!
    const user = await User.findById(decodedToken?._id);

    //check for user is valid , correct or not!!
    if (!user) {
      throw new ApiError(401, "invalid refresh token!!");
    }

    //now check or verify that the user provided refresh token is similar to the token that is stored in db then only we can give acces

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(404, "Refresh token provided is not matching!!");
    }

    //now if they both match then generate our tokens so that user can log in again

    const { accessToken, newRefreshToken } = generateAccessAndRefreshTokens(
      user?._id
    );

    options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          201,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid token refreshment!!");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //1 taking passwords from body(frontend) thru req.body and destructuring it

  const { oldPassword, newPassword } = req.body;

  //now use User to retrieve user from db
  const user = await User.findById(req.user._id);

  //now check that the given oldpassword by user is equal to the password in db or not!!
  const isPasswordCorrect = await User.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(402, "Invalid old password");
  }

  //now we have access of db thru user and we  can change password and save it

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  //return an response of successfully password changed

  return res
    .status(200)
    .json(new ApiResponse(201, {}, "Password Updated Successfully"));
});

//now if we want the details of current user then we can get it back using req.user

const getCurrentUserDetails = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
});

//updating account details and a developer decides which details he want to update!!

const updateAccountDetails = asyncHandler(async (req, res) => {
  //take data from body(frontend) as per your choice or requirements of update
  const { fullName, email } = req.body;

  //check if fullname or email is valid or not
  if (!(fullName || email)) {
    throw new ApiError(404, "Invalid fullName or email");
  }

  //now after checking the next step is to take user and then update details!!
  const user = await User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email, //here we can also write them as fullName : fullName , email : "email"
      },
    },
    {
      new: true, // this is used because the findOneAndUpdate method after updating returns the before updation value but with
      //this new keyword we can return new updated value
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Details Updated Successfully"));
});

//updating the avatar file
const updateUserAvatarFile = asyncHandler(async (req, res) => {
  //taking avatar on local from file path
  const avatarLocalPath = req.file?.path;

  //checking if avatar is valid or correct
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  //now here if firstly we want to delete the old file that is uploaded on cloudinary!!
  // Search for the file in Cloudinary media library
  // cloudinary.search
  //   .expression('filename:old_file_name') // Change 'old_file_name' to the filename of the old file
  //   .max_results(1)
  //   .execute()
  //   .then(result => {
  //     if (result.total_count > 0) {
  //       const publicId = result.resources[0].public_id;
  //       // Now you have the public ID, you can proceed with deletion and upload
  //       cloudinary.uploader.destroy(publicId, function(error, result) {
  //        if (error) {
  //   console.error(error);
  // } else {
  //   console.log('Old file deleted successfully');

  //       });
  //     } else {
  //       console.log('File not found in Cloudinary media library');
  //     }
  //   })
  //   .catch(error => {
  //     console.error(error);
  //   });

  //now we have found our avatar file path then upload it on cloudinary!!
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  //check for avatar
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  const user = await User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar file updated successfully"));
});

//update the cover image of the user

const updateUserCoverFile = asyncHandler(async (req, res) => {
  //taking coverImage on local from file path
  const coverFileLocalPath = req.file?.path;

  //checking if file is valid or correct
  if (!coverFileLocalPath) {
    throw new ApiError(400, "Cover image file is missing");
  }

  //now here if firstly we want to delete the old file that is uploaded on cloudinary!!
  // Search for the file in Cloudinary media library
  // cloudinary.search
  //   .expression('filename:old_file_name') // Change 'old_file_name' to the filename of the old file
  //   .max_results(1)
  //   .execute()
  //   .then(result => {
  //     if (result.total_count > 0) {
  //       const publicId = result.resources[0].public_id;
  //       // Now you have the public ID, you can proceed with deletion and upload
  //       cloudinary.uploader.destroy(publicId, function(error, result) {
  //        if (error) {
  //   console.error(error);
  // } else {
  //   console.log('Old file deleted successfully');

  //       });
  //     } else {
  //       console.log('File not found in Cloudinary media library');
  //     }
  //   })
  //   .catch(error => {
  //     console.error(error);
  //   });

  //now we have found our cover img file path then upload it on cloudinary!!
  const coverImage = await uploadOnCloudinary(coverFileLocalPath);

  //check for cover image
  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading on cloudinary");
  }

  const user = await User.findOneAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover file updated successfully"));
});

//here the use of this fxn is to take user profile and update their subscribers and no. they subscribedTo
const getUserChannelProfile = asyncHandler(async (req, res) => {
  //take user's username  from req.params because thru params we can take the url of username
  const { userName } = req.params;

  //check if username given is valid or not
  if (!userName) {
    throw new ApiError(404, "Invalid username provided");
  }

  //now we will apply the aggregation pipelines like match, lookup, project ,addfields etc

  const channel = await User.aggregate([
    {
      $match: {
        userName: userName, //this is the first match pipeline we used to just match the username provided by the user to the db
      },
    },
    {
      $lookup: {
        from: "subscriptions", //from where we want to take our details because right now we are writting pipelines in user behalf
        localField: "_id", //in our user model where we want to add that we are taking from foreign place
        foreignField: "channel", //in other model from which field we have to take the details
        as: "subscribers", //field ka naam kya rkhna hai
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", //size is used to calculated all the documents name subscribers and move the no. to the field we have created
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            //condition is used to check some situations which are boolean type using if/else/then
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            false: false,
          },
        },
      },
    },
    {
      $project: {
        //project is used to check(1),uncheck(0) so that checked values are to be return
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!(channel.length > 0)) {
    //(!channel?.length)
    throw new ApiError(400, "Channel does not exist");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User Profile fetched successfully")
    );
});

//now we have to trach our watchhistory by using same pipelines
const getUserWatchHistory = asyncHandler(async (req, res) => {
  // now with the help of aggregation pipelines first we take videos id from videos to watchhistory at users
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id), //here we have to use mongoose to get id of users as it does not provide the real id in aggregation by _id
      },
    },
    {
      $lookup: {
        from: "videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",

        pipeline:[    //this pipeline we used because we got the history but there is a field in videos named owner which is empty so we have to retrieve it from users and inside the first lookup 
        {
          $lookup:{
            from: "users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
              {
                $project :{
                  fullName:1,
                  userName:1,
                  avatar:1
                }
              }
            ]
          }
        },
        {
          $addFields:{
            owner: {
              $first:"$owner"  //this is to get the 0th index value of array(owner) and to overwrite the field owner with owner but content changed
            }
          }
        }
        
        ]
      },
      
    },
  ]);

  //send response
  return res
  .status(200)
  .json(
    new ApiResponse(201,user[0].watchHistory,"watch history fetched successfully")
  )
});

export {
  registerUser,
  loginUser,
  loggedOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUserDetails,
  updateAccountDetails,
  updateUserAvatarFile,
  updateUserCoverFile,
  getUserChannelProfile,
  getUserWatchHistory,
};
