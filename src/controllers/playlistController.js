import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playListModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { Video } from "../models/videoModel.js";
import { User } from "../models/userModel.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if ([name, description].some( fields => fields.trim() === "" || undefined)) {
    throw new ApiError(400, " All Fields Are Required ");
  }

  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });
  
  if(! newPlaylist) throw new ApiError(400, "somethig went wrong while creating playlist please try again ")

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, " playlist Has Been created "));

});



const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  const user = await User.exists({_id:userId});
  
  if(! user) throw new ApiError(404 , " user not found ")

  if (! isValidObjectId(userId)) {
    throw new ApiError(400, " Invalid User Id ");
  }
  
  const playlist = await Playlist.aggregate([
        {
            $match:{
              owner: new mongoose.Types.ObjectId(userId)
            }
        },
        
        {
            $lookup:{
               from:"videos",
               localField:"videos",
               foreignField:"_id",
               as:"videos"
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
            },
          }
        }

  ]);

  

  if(playlist.length < 0) throw new ApiError(404, " this user don't have playist ")

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, " plalist Has Been created "));

});



const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id


  if(! isValidObjectId(playlistId )){
    throw new ApiError(400, " Invalid Playlist Id " )
  }

  const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },

        {
            $lookup:{
              from:"videos",
              localField:"videos",
              foreignField:"_id",
              as:"videos"
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
                        $project: {
                            fullName:1,
                            username:1,
                            "avatar.url":1,
                            "coverImage.url":1
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
  ])

  if(!playlist){
    throw new ApiError(400," There is No Plalist Available In This Id ")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, " plalist Has Been created "));


});



const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!playlistId && !videoId) throw new ApiError(400, " Please Prive Playlist Id and Video Id ");
  
  const video = await Video.exists({_id:videoId});
 
  if(!video) throw new ApiError(404," video not found");

  if(! isValidObjectId(videoId)) throw new ApiError(400," invalid video id ")

  const playlist =  await Playlist.updateOne({_id:playlistId}, {
      $push:{
        videos:videoId 
      }
    },{new:true})


  if(! playlist){
    throw new ApiError(400 , playlist , " Playlist Not Found ")
  }


  return res
    .status(200)
    .json(new ApiResponse(200, playlist, " plalist Has Been created "));
});



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  await Playlist.updateOne({_id:playlistId},{
    $pull:{ videos:videoId }
  },{new:true})

  return res
    .status(200)
    .json(new ApiResponse(200, {}, " video has been romoved from playlist "));


});



const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  await Playlist.findByIdAndDelete(playlistId); 

  return res
    .status(200)
    .json(new ApiResponse(200, {}, " playlist Has Been Deleted  "));
});



const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  const playlist = await Playlist.findByIdAndUpdate(playlistId , {
     $set:{
        name,
        description
     }
  } , { new:true })

  
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, " plalist Has Been updated  "));
});




export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
