import { Router } from "express";
import { loggedOutUser, loginUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

    router.route("/login").post(loginUser);

    //secure routes
    router.route("/logout").post(verifyJWT,loggedOutUser)    //here we used verifyjwt before loggedoutuser to cross check everytime he 
    //perfomed an action to confirm it is an loggin user and we used next in verifyjwt to jump on next task!!

    router.route("/refresh-token-refreshed").post(refreshAccessToken)

export default router;
