import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playListModel.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if ([name, description].some((fields) => fields.trim() === "" || undefined)) {
    throw new ApiError(400, " All Fields Are Required ");
  }

  const playlist = await Playlist.exists({ name });

  if (playlist) {
    throw new ApiError(
      400,
      " This Name is Aleady Taken Please Enter Another Name of Playlist"
    );
  }


  const newPlaylist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
  });


  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, " plalist Has Been created "));
});



const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  if (isValidObjectId(userId)) {
    throw new ApiError(400, " Invalid User Id ");
  }

  const plalist = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
          {
            $addFields: {
              owner: "$owner",
            },
          },
        ],
      },
    },
  ]);

  if(!plalist){
    throw new ApiError(400," This User Does't Have Playlist ")
  }

  console.log(plalist)

  return res
    .status(200)
    .json(new ApiResponse(200, plalist, " plalist Has Been created "));

});



const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id


  if(! isValidObjectId(playlistId )){
    throw new ApiError(400, " Invalid Playlist Id " )
  }

  const plalist = await Playlist.aggregate([
    {
        $match:{
            _id: new mongoose.Types.ObjectId(playlistId)
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
            },
            {
                $addFields:{
                    owner:{
                     $firs:"$owner"
                    }
                }
            }
           ]
        }
    }
  ])

  if(!plalist){
    throw new ApiError(400," There is No Plalist Available In This Id ")
  }
  console.log(plalist)




  return res
    .status(200)
    .json(new ApiResponse(200, plalist, " plalist Has Been created "));


});



const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if(!playlistId || !videoId){
    throw new ApiError(400, " Please Prive Playlist Id and Video Id ");
  }

 const plyalist =  await Playlist.updateOne({vide:videoId}, {
    $push:{
      videos:videoId 
    }
  })


  if(! plyalist){
    throw new ApiError(400 , " Playlist Not Found ")
  }


  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, " plalist Has Been created "));
});



const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  return res
    .status(200)
    .json(new ApiResponse(200, newPlaylist, " plalist Has Been created "));
});



const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist

  await Playlist.findByIdAndDelete(playlistId); 

  return res
    .status(200)
    .json(new ApiResponse(200, {}, " plalist Has Been Deleted  "));
});



const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  const plalist = await Playlist.findByIdAndUpdate(playlistId , {
     $set:{
        name,
        description
     }
  } , { new:true })

  
  return res
    .status(200)
    .json(new ApiResponse(200, plalist, " plalist Has Been updated  "));
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
