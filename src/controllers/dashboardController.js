import mongoose from "mongoose"
import {Video} from "../models/videoModel.js"
import {Subscription} from "../models/subscriptionModel.js"
import {Like} from "../models/likeModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    
    
    const totalVideosView = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group:{
                _id:null,
                totalViews:{$sum:"$views"},
            },
        },
        
       
    ]);
    const totalVideosCount = await Video.countDocuments({owner:req.user?._id.toString()});
    const totalSubscriberCount = await Subscription.countDocuments({channel:req.user?._id.toString()});
    const commentLikeTotalCount = await Like.countDocuments({comment:req.user?._id.toString()});
    const videoLikeTotalCount = await Like.countDocuments({video:req.user?._id.toString()});
    const tweetLikeTotalCount = await Like.countDocuments({tweet:req.user?._id.toString()});
   
    return res
    .status(200)
    .json(
        new ApiResponse(200,{
            totalViews:totalVideosView[0].totalViews,
            totalVideosCount,
            totalSubscriberCount,
            commentLikeTotalCount,
            videoLikeTotalCount,
            tweetLikeTotalCount
        },
        " Feched Data successfully"
        )
    )
    
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await Video.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            username:1,
                            "avatar.url":1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:"$owner"
                }
            }
        }
    ]);

    if(videos.length < 0){
        throw new ApiError(404," Videos not found of This Channel ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos , "All videos Feched Successfully ")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }