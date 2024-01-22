import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/videoModel.js"
import {User} from "../models/userModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const options = {
        page,
        limit
    }
    const videos = await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $sort:{
                videoFile:sortBy
            }
        }
    ])

    const result = await Video.aggregatePaginate(videos,options);

    return res
    .status(200)
    .json(
        200,result , " Here The Result "
    )

})


const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if( [title,description].some( fields => fields.trim() === "" || undefined )){
        throw new ApiError(400 , " All fields are Required ");
    }
   

    let videoLocalPath;
    if( req.files &&
        Array.isArray(req.files.videoFile) &&
        req.files.videoFile?.length > 0)
        {
            videoLocalPath = req.files?.videoFile[0].path
        }
        
        if(!videoLocalPath){
            throw new ApiError(400," video is requried for published ")
        }
        
    let thumbnailLocalPath = req.files?.thumbnail[0].path
    if(!thumbnailLocalPath){
        throw new ApiError(400," thumbnail is requried for published ")
    }
    
    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!(video||thumbnail)){
        throw new ApiError(400,"something went wrong while uploading video and thumbnail on cloudinary ");
    }

    const createdVideo = await Video.create({
        title,
        description,
        videoFile:video.url,
        thumbnail:thumbnail.url,
        owner:req.user?._id,
        duration:video?.duration,
        views:0,
        isPublished:true,
    });


    if(!createdVideo){
        throw new ApiError(400," Something went wrong while Saving Into DB ");
    }

    return res
    .status(200)
    .json(
        200, createdVideo ,"  Video  Uploaded Successfully "
    )

   
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}