import mongoose ,{ isValidObjectId } from "mongoose"
import { Comment } from "../models/commentModel.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
   
    if(!isValidObjectId(videoId)){
        throw new ApiError(400," invlid video Id ");
    }

    const comment = await Comment.aggregate([
        {
            $match:{
               video: new mongoose.Types.ObjectId(videoId) 
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
                            avatar:1
                        }
                    }
                ]
            }
        }
    ])

    console.log(comment);
    return res
    .status(201)
    .json(
        200,comment," video comments is fethed "
    )

    
})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params

    if( !videoId ){
        throw new ApiError(400," invalid video id ");
    }

   const comment =  await Comment.create({
        content:req.body.content ? content : "Please enter your comment first " ,
        video:videoId,
        owner:req.user?._id

    });

    return res
    .status(201)
    .json(
        200,comment," comment is added "
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }