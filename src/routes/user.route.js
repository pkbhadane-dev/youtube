import express from "express";
import { userRegister } from "../controllers/user.controller.js";

const userRouter = express.Router();

userRouter.route("/register").post(userRegister);  // using this syntax we can use multiple methods i.e-put,get etc. for same path

// router.post("/register", userRegister) // common and simple syntax

export default userRouter;
