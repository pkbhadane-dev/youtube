import express from "express";
import {
  changePassword,
  getChannelProfile,
  getWatchHistory,
  refreshAccessToken,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  userLogin,
  userLogout,
  userRegister,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = express.Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  userRegister,
); // using this syntax we can use multiple methods i.e-put,get etc. for same path

userRouter.route("/login").post(userLogin);
userRouter.route("/refresh").post(refreshAccessToken);

// secured routes
userRouter.route("/logout").post(verifyJWT, userLogout);
userRouter.route("/change-password").post(verifyJWT, changePassword);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);
userRouter
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRouter
  .route("/coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
userRouter
  .route("/channel-profile/:username")
  .get(verifyJWT, getChannelProfile);
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);

// router.post("/register", userRegister) // common and simple syntax

export default userRouter;
