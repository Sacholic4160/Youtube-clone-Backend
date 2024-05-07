import express from "express";
import { Router } from "express";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

//add a comment router
router.route("/add-comment/:videoId").post(addComment);
//get all comments of a video router
router.route("/get-comments/:videoId").get(getVideoComments);
//router to update a comment
router.route("/update-comment/:commentId").patch(verifyJWT, updateComment);
//router to delete a comment
router.route("/delete-comment/:commentId").delete(verifyJWT, deleteComment);

export default router;
