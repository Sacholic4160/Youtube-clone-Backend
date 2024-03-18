//here we create a method to check wether a user is loggein or they are authenticated or not!!

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req,res ,next) => { //we can also use underscore(_) at the place of (res)
  try {
    //here we using the try catch block retrieving the tokens from cookies or from header to replace it !!

    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
console.log(token);

    if (!token) {
      throw new ApiError(401, "unauthorised request while accessing the token from cookie");
    }

    //cross checking the tokens using a inbuilt method of jwt with the secret token!!
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);


    //after we can retrieve user from tokens if we found them without the password and refresh token because after logout we have to dlt them!!

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user) {
        throw new ApiError(404, "Invalid user tokens");
    }
    // now we created a user so we can snd thiss user details without password and refreshtoken to req.user a new creation!!

    req.user = user;
    next();
    
  } catch (error) {
    throw new ApiError(401, "unauthorised request while verifying the user");
  }
});
