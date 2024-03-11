import { Router } from "express";
import {registerUser} from "../controllers/user.controller.js";

const router =Router()
 
//route for registering a user

router.route("/register").post(registerUser)

export default router