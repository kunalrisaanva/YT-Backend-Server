import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweetModel.js"
import {User} from "../models/userModel.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import asyncHandler  from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const content = req.body.tweet;
   
    const user = await User.exists({_id:req.user?._id})

    if(!user) throw new ApiError(404,"user not found ")

    if(!content) throw new ApiError(400," Please Enter Your Tweet First ");


    const tweet = await Tweet.create({
        owner: req.user?._id,
        content
    });


    if(!tweet){
        throw new ApiError(400," Something Went Wrong While Creating Tweet Please Try Again ")
    }


    const createdTweet = await Tweet.findOne({
        _id:new mongoose.Types.ObjectId(tweet._id)
    }).select(" -createdAt -updatedAt ") 


    return res
    .status(201)
    .json(
        new ApiResponse(201,createdTweet," tweet Created ")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
     const userId = req.params.userId;

    const existedUser = await User.exists({_id:userId})

    if(! existedUser) throw new ApiError(404," user not found ")

    if(isValidObjectId(userId)){
        throw new ApiError(400," invalid user request ")
    }

   const user = await Tweet.aggregate([
            {
                $match:{
                    owner: new mongoose.Types.ObjectId(userId)
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
                        $first:"owner"
                    }
                }
            }

    ]);

    if(user.length < 0){
        throw new ApiError(404, " tweet not found ")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200,user," user tweets fecthed successfully ")
    )
})


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const tweetId = req.params.tweetId;

    if(!tweetId){
        throw new ApiError(400," invlid tweet Id ")
    }

    const updateTweet = await Tweet.findByIdAndUpdate({_id:tweetId},{$set:{
        content:req.body?.content
    }},{new:true});
    

    return res
    .status(200)
    .json(
        new ApiResponse(204,updateTweet," tweet deleted ")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const tweetId = req.params.tweetId

    if(!tweetId){
        throw new ApiError(400," invlid tweet Id ")
    }

    await Tweet.findByIdAndDelete(tweetId);
   
    return res
    .status(200)
    .json(
        new ApiResponse(204,{}," tweet deleted ")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}