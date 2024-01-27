import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/likeModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";


const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, " Invlid Video Id ");
  }

  const unLike = await Like.exists({ video: videoId });

  if (unLike) {
    await Like.findByIdAndDelete(unLike);
  } else {
     await Like.create({
        video: videoId,
        likedBy: req.user?._id,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, unLike ? " video  unliked " : "video Liked"));
});


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment

  const comment = await Like.exists({ comment: commentId });

  if (comment) {
    await Like.findByIdAndDelete(comment);
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user?._id,
    });
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, comment ? " comment unliked " : "commend Liked")
    );
});


const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet

  const tweet = await Like.exists({ tweet: commentId });

  if (tweet) {
    await Like.findByIdAndDelete(tweet);
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user?._id,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, comment ? " tweet unliked " : "tweet Liked"));
});



const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
