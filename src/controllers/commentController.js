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
                            avatar:1,
                        }
                    }
                ]
            }
        }
    ])

    if(!comment){
        throw new ApiError(400," video Id not valid ")
    }
    
    return res
    .status(201)
    .json(
        new ApiResponse(  200,comment," video comments is fethed ")
    )

    
})


const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    
    if( ! isValidObjectId(videoId) ){
        throw new ApiError(400," invalid video id ");
    }

   const comment =  await Comment.create({
        content:req.body?.content ,
        video:videoId,
        owner:req.user?._id

    });

    return res
    .status(201)
    .json(
        new ApiResponse(  200,comment," video comments is fethed ")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    // TODO: update a comment
    const { content } = req.body;

    if(! isValidObjectId(commentId)){
        throw new ApiError(404 , " Invlid Comment Id ")
    }
    
    const comment = await Comment.findById(commentId).select(" -createdAt -updatedAt ")
   
    if(!req.user?._id === new mongoose.Types.ObjectId(comment.owner)){
        throw new ApiError(400," Invlid User !! This User Don't Have Permission To Edite This Comment")
    }
    
    comment.content = content;

    await comment.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(
        new ApiResponse(200, comment , " Comment is Edited ")
    )


})

const deleteComment = asyncHandler(async (req, res) => {

    const { commentId } = req.params
    // TODO: delete a comment
    if(! isValidObjectId(commentId)){
        throw new ApiError(404 , " Invlid Comment Id ")
    }
    
    const commentFind = await Comment.findById(commentId).select(" -updatedAt -updatedAt ")

    if(!req.user?._id === new mongoose.Types.ObjectId(commentFind.owner)){
        throw new ApiError(400," Invlid User !! This User Don't Have Permission To Edite This Comment")
    }
    
    const comment = await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {} , " Comment is Deleted ")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }