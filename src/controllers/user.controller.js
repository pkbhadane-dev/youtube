import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

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

  if (!username || !email || !password) {
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
    .cookies("accessToken", accessToken, options)
    .cookies("refreshToken", refreshToken, options)
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
  console.log("userId from logout", userId);

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: undefined } },
    { new: true },
  );
  await user.save();

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookies("accessToken", option)
    .clearCookies("refreshToken", option)
    .json(new ApiResponse(200, {}, "logout successfull"));
});
