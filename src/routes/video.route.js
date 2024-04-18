import { Router } from "express";
import {
  deleteVideoById,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishVideo,
  updateVideoById,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//here we have to use verifyJWT for all the methods because a loggedin user can only perform these processes and we
// use here is (use) keyword because it is a middleware!!
//router.use(verifyJWT);

//1.  the second one is to upload a video thru multer and then finally on cloudinary and we have to upload a video thru it so we have used
// upload.fields for uploading videos and thumbnails method in post before writting of the publish method !!!!
router.route("/publish-video").post(verifyJWT,
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);                                                                                                                                                                    
//2.    here is the first router we are writting in video router to get all the videos of a specified user!!
router.route("/getAll-videos").get(getAllVideos);


//3 this route is for getting a video by its id !!
router.route("/:videoId").get(verifyJWT,getVideoById);

//4 this route is for updating a video by its id!!
router
  .route("/update-video/:videoId")
  .patch(verifyJWT,upload.single("thumbnail"), updateVideoById);

//5 this route is for deleting a video by its id!!
router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideoById);

//6 this route is for toggling a video by its id!!
router.route("/:toggle-video/:videoId").patch(verifyJWT,togglePublishVideo)
//export router from here as default because we can name it anything in our app.js
export default router;
