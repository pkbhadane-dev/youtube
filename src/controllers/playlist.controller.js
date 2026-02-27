import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

export const creatPlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user?._id;

  if (!title) {
    throw new ApiError(400, "Title is required for playlist");
  }

  const playlist = await Playlist.create({
    title,
    description,
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist created successfully"));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "playlist & video Id are required");
  }

  const playlist = await Playlist.findById(playlistId);
  const addVideo = (playlist.video = videoId);
  await addVideo.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, addVideo, "Video successfully added in playlist"),
    );
});

export const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid userId");
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "playlistVideo",
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
                    avatar: 1,
                    fullname: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              onwer: {
                $first: "$onwer",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, playlists[0], "playlist fetched successfully"));
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }

  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Schema.Types.ObjectId(userId),
      },
      $lookup: {
        from: "videos",
        foreignField: "_id",
        localField: "video",
        as: "videoDetails",
        pipeline: [
          {
            $project: {
              title: 1,
              thumbnail: 1,
              description: 1,
              duration: 1,
              views: 1,
            },
          },
        ],
      },
      $addFields: {
        videoDetails: {
          $first: "$videoDetails",
        },
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        userPlaylists[0],
        "All playlists fetched successfully",
      ),
    );
});

export const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist OR video Id");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.onwer?.toString() !== userId.toString()) {
    throw new ApiError(
      400,
      "you are not authorized to remove video from playlist",
    );
  }

  await Playlist.findByIdAndDelete(videoId);

  return res(200).json(new ApiResponse(200, {}, "Video removed from playlist"));
});

export const updatePlaylist = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner?.toString() !== userId.toString()) {
    throw new ApiError(400, "you are not authorized to update this playlist");
  }

  const updatePlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        title,
        description,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatePlaylist, "playlist updated successfully"),
    );
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user?._id;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid playlistId");
  }

  const playlist = await Playlist.findById(playlistId);

  if (playlist.owner?.toString() !== userId.toString()) {
    throw new ApiError(400, "you are not authorized to delete this playlist");
  }

  await Playlist.findByIdAndDelete(playlistId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Playlist deleted successfully"));
});
