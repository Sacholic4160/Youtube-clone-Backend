import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

//route for registering a user

router.route("/register").post(
    upload.fields([    //here we used fields instead of using an array because array takes multiple values inside it but we have to put multiple files at multiple places
    {
        name: "avatar",    //always remember to inject a middleware just before or in the middle of some method
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }

    ])
    ,registerUser);

export default router;
