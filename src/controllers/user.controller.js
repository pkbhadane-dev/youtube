import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating token");
  }
};

export const userRegister = asyncHandler(async (req, res) => {
  const { username, fullname, email, password } = req.body;

  // validation pending //

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email and username already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage[0]?.path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "User avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is failed to save on cloudinary");
  }

  const user = await User.create({
    fullname,
    username,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const filteredUserData = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .json(
      new ApiResponse(201, filteredUserData, "user registered successfully"),
    );
});

export const userLogin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // validation pending

  if (!(username || email) || !password) {
    throw new ApiError(401, "All credentials are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(500, "user does not exist");
  }

  const veryfiedPassword = await user.isPasswordCorrect(password);

  if (!veryfiedPassword) {
    throw new ApiError(401, "incorect credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user); // i have one dout here, can we pass user as a parameter instead of user._id

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User successfuly login",
      ),
    );
});

export const userLogout = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const user = await User.findByIdAndUpdate(
    userId,
    { $unset: { refreshToken: 1 } },
    { new: true },
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", option)
    .clearCookie("refreshToken", option)
    .json(new ApiResponse(200, {}, "logout successfull"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  const verifyRefreshToken = jwt.verify(
    token,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const userId = verifyRefreshToken._id;

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }

  if (token !== user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expire");
  }
  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "Access token generated",
      ),
    );
});

export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user?._id;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new ApiError(401, "All credentials are required");
  }

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "new-password & confirm-password are not match");
  }

  const user = await User.findById(userId);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "old-password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  const userId = req.user?._id;

  if (!fullname || !email) {
    throw new ApiError(401, "All credentials are required");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        email,
        fullname,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated"));
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "User avatar is required");
  }

  const updatedAvatar = await uploadOnCloudinary(avatarLocalPath);

  if (!updatedAvatar?.url) {
    throw new ApiError(400, "Failed to upload on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { avatar: updatedAvatar?.url } },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image is required");
  }

  const updatedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!updatedCoverImage?.url) {
    throw new ApiError(400, "Failed to upload on cloudinary");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage: updatedCoverImage?.url,
      },
    },
    { new: true },
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "cover-image updated successfully"));
});

export const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.param;

  if (!username) {
    throw new ApiError(400, "username is missing");
  }

  const userChannel = await User.aggregate([
    {
      $match: { username: username },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        subscribedChannelCount: {
          $size: "$subscribedChannels",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        email: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedChannelCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(400, "Channel does not exist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, userChannel[0], "channel fetched successfully"));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    email: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "user watch history fetched successfully",
      ),
    );
});
