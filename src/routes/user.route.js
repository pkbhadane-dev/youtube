import express from "express";
import { refreshAccessToken, userLogin, userLogout, userRegister } from "../controllers/user.controller.js";
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

userRouter.route("/login").post(userLogin)

userRouter.route("/logout").post(verifyJWT, userLogout)

userRouter.route("/refresh").post(refreshAccessToken)


// router.post("/register", userRegister) // common and simple syntax

export default userRouter;
