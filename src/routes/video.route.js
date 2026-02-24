import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  uploadVideo,
} from "../controllers/video.controller";
import { upload } from "../middlewares/multer.middleware";

const videoRouter = express.Router();

videoRouter.use(verifyJWT);

videoRouter
  .route("/")
  .get(getAllVideos)
  .post(
    upload.fields([
      { name: "video", maxCount: 1 },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    uploadVideo,
  );

videoRouter
  .route("/:videoId")
  .get(getVideoById)
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);
