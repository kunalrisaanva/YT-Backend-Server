import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/userModel.js"
import { Subscription } from "../models/subscriptionModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    
    if( !isValidObjectId(channelId) ){
        throw new ApiError(400 , " Invalid Channel Id " )
    }


    const channel = await User.exists({_id:channelId});

    if(!channel){
        throw new ApiError(404 , " channel not found")
    }

        // prevent subscribe to own channel 

        if(channelId.toString() === req.user?._id){
            throw new ApiError(404 , " You cannot subscribe your own channel ")
        }

     
    const subscribed = await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId
    })



    if(subscribed){
         await Subscription.findByIdAndDelete(subscribed._id)
    }else{
            await Subscription.create({
                subscriber:req.user?._id,
                channel:channelId
            })
    }
    

    return res 
    .status(200)
    .json(
        new ApiResponse(200, subscribed ? " Channel Unsubscribed " : " Channel Subscribed ")
    )



})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    
    const channel = await User.exists({_id:channelId});
    if (!channel) {
        throw new ApiError(404, "Channel not find!");
    }

    const subscriber = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            "avatar.url": 1
                        }
                    }
                ]
            }
        },
        {
            $project:{
                _id:1,
                subscriber:1,
                channel:1
            }
        },
        {
            $addFields: {
                subscriber: {
                    $first: "$subscriber"
                }
            }
        }
    ])
   
    if(subscriber.length < 0){
        throw new ApiError(404 , " subscriber not found ")
    }

    return res
    .status(200)
    .json(
        new ApiResponse( 200,subscriber,"Subscriber lists fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if( !isValidObjectId ){
        throw new ApiError(400, " Invalid Subscriber Id ")
    }
    const subscriber = await User.exists({_id:subscriberId});


    if(! subscriber){
        throw new ApiError(404, " Subscriber not found ")
    }

    const channel = await Subscription.aggregate( [
                    {
                        $match:{
                            subscriber: new mongoose.Types.ObjectId(subscriberId)
                        }
                    },

                    {
                        $lookup:{
                            from:"users",
                            localField:"channel",
                            foreignField:"_id",
                            as:"channelSubscribed",
                            pipeline:[
                                {
                                    $project:{
                                        username:1,
                                        fullName:1,
                                        "avatar.url":1,
                                    }
                                },
                              
                            ]
                        },
                     
                    },
                    {
                        $addFields:{
                            channelSubscribed:{
                                $arrayElemAt:["$channelSubscribed",0,]
                            }
                        }
                    }
                    
                    
                    
          ] )

   
   if( channel.length < 0){
     throw new ApiError(404, "subscriber list not found ")
   }

   return res
   .status(200)
   .json(
     new ApiResponse(200 , channel , " user has subscribed these channels " )
   )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}