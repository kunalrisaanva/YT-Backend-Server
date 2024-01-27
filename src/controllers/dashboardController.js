import mongoose from "mongoose"
import {Video} from "../models/videoModel.js"
import {Subscription} from "../models/subscriptionModel.js"
import {Like} from "../models/likeModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    await Video.aggregate( [
        {
            $match:{
                  
            }
        }
    ] )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }