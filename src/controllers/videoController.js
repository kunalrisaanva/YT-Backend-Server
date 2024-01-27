import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/videoModel.js";
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const options = {
    page,
    limit,
  };
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $sort: {
        videoFile: sortBy,
      },
    },
  ]);

  const result = await Video.aggregatePaginate(videos, options);

  return res.status(200).json(200, result, " Here The Result ");
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (
    [title, description].some((fields) => fields.trim() === "" || undefined)
  ) {
    throw new ApiError(400, " All fields are Required ");
  }

  let videoLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile?.length > 0
  ) {
    videoLocalPath = req.files?.videoFile[0].path;
  }

  if (!videoLocalPath) {
    throw new ApiError(400, " video is requried for published ");
  }

  let thumbnailLocalPath = req.files?.thumbnail[0].path;

  if (!thumbnailLocalPath) {
    throw new ApiError(400, " thumbnail is requried for published ");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(video || thumbnail)) {
    throw new ApiError(
      400,
      "something went wrong while uploading video and thumbnail on cloudinary "
    );
  }

  const createdVideo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    owner: req.user?._id,
    duration: video.duration,
  });


  if (!createdVideo) {
    throw new ApiError(400, " Something went wrong while Saving Into DB ");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, createdVideo, "  Video  Uploaded Successfully ")
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findById(videoId).select(" -createdAt -updatedAt ");

  if (!video) {
    throw new ApiError(404, " video Not Found ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "  Video fetch Successfully "));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  //TODO: update video details like title, description, thumbnail

  if (req.file === undefined) {
    throw new ApiError(400, " Please enter Your thumbnail ");
  }

  let thumbnailLocalPath;

  if (req.file && req.file?.path) {
    thumbnailLocalPath = req.file?.path;
  }

  let response;
  if (thumbnailLocalPath) {
    response = await uploadOnCloudinary(thumbnailLocalPath);
  }

  const { title, description } = req.body;

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: response?.url,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, video, " Video Details Updated  Successfully "));
});



const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findByIdAndDelete(videoId);

  if (!video) {
    throw new ApiError(404, " Video Not Found ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "  Video Deleted Successfully "));
});



const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

 
  const videoSatus = await Video.findOne({_id:videoId});

  if(videoSatus.isPublished = true ){
     videoSatus.isPublished = false
  }else{
    videoSatus.isPublished = true 
  }

  await videoSatus.save( {validateBeforeSave:false} )

  return res
    .status(200)
    .json(
      new ApiResponse(200, videoSatus ? "is publihed ":" Private  ")
    );


});



export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
