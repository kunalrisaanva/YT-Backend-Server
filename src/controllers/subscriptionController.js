import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/userModel.js"
import { Subscription } from "../models/subscriptionModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    
    if( !(isValidObjectId(channelId) &&  channelId) ){
        throw new ApiError(400 , " Invalid Channel Id  or Missing Channel Id " )
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
        new ApiResponse(200, user ? " Channel Unsubscribed " : " Channel Subscribed ")
    )



})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if( isValidObjectId(channelId)){
        throw new ApiError(400 , " Invlid Channel Id ")
    }

    const subsciber = await Subscription.aggregate([
            {
                $match:{
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },

            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subsciber",
                    pipeline:[
                        {
                            $project:{
                                username:1,
                                fullName:1
                            }
                        }
                    ]

                },

            subsciber:{
                $push: "$username"        
            }

            },


            
        ])

        console.log(subsciber)


        return res
        .status(200)
        .json(
            new ApiResponse(200  , subsciber  , " Subscriber List Of channel ")
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channel = await Subscription.aggregate( [
                    {
                        $match:{
                            channel: new mongoose.Types.ObjectId(subscriberId)
                        }
                    },

                    {
                        $lookup:{
                            from:"users",
                            localField:"channel",
                            foreignField:"_id",
                            as:"channel",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }  
                    }
          ] )

   console.log(channel);

   return res
   .status(200)
   .json(
     new ApiResponse(200 , {} , " channel list " )
   )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}