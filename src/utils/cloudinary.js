import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (loacalFilePath) => {
  try {
    if (!loacalFilePath) return null;

    const response = await cloudinary.uploader.upload(loacalFilePath, {
      resource_type: "auto",
    });

    fs.unlinkSync(loacalFilePath);

    console.log("file successfully upload on cloudinary", response.url);

    return response;
  } catch (error) {
    fs.unlinkSync(loacalFilePath);
    console.log("Cloudinary upload failed", error);
    return null;
  }
};
