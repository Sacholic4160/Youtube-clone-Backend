import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUserDetails,
  getUserChannelProfile,
  getUserWatchHistory,
  loggedOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatarFile,
  updateUserCoverFile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//route for registering a user
// router.route("/").post( (req,res) => {
//     res.status(200).json({
//       message: "This is student get request",
//     });
//   });

router.route("/register").post(
  upload.fields([
    //here we used fields instead of using an array because array takes multiple values inside it but we have to put multiple files at multiple places
    {
      name: "avatar", //always remember to inject a middleware just before or in the middle of some method
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser);

router.route("/login").post(loginUser);

//secure routes
router.route("/logout").post(verifyJWT, loggedOutUser); //here we used verifyjwt before loggedoutuser to cross check everytime he
//perfomed an action to confirm it is an loggin user and we used next in verifyjwt to jump on next task!!

router.route("/refresh-token-refreshed").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT,changeCurrentPassword);    //here we used verifyjwt so that it verifies first that the user is loggedin or not
router.route("/currentUser-details").get(getCurrentUserDetails);
router.route("/update-account").patch(verifyJWT,updateAccountDetails);   //here we used patch because we have to update only few selected details and if we used post here it will update all the details
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatarFile);   //here we have to use multer in between because we have to upload a single 
//file that's why we used single here and in controller we used file instead of files at the time of uploading
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverFile);

router.route("/c/:userName").get(verifyJWT,getUserChannelProfile);   //here we have to use userName as it is because we had taken it from params as the same name 
// and (/c/:) is also used before it everytime we use params to take details
router.route("/watch-history").get(verifyJWT,getUserWatchHistory);

export default router;
