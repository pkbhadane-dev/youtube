import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  if (userId && !isValidObjectId(userId)) {
    throw new ApiError(400, "invalid userId");
  }

  const allVideos = Video.aggregate([
    {
      $match: {
        $and: [
          query ? { title: { $regex: query, $options: "i" } } : {},
          userId ? { owner: new mongoose.Types.ObjectId(userId) } : {},
        ],
      },
    },
    {
      $sort: {
        [sortBy || "createdAt"]: sortType?.toLowerCase() === "desc" ? -1 : 1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetail",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$ownerDetail",
        },
      },
    },
  ]);

  const option = {
    page,
    limit,
  };

  const filterAllVideos = await Video.aggregatePaginate(allVideos, option);

  return res
    .status(200)
    .json(
      new ApiResponse(200, filterAllVideos, "All videos fetched successfully")
    );
});
