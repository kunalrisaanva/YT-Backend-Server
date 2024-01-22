import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary , delteOnCloudinray } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose"



const genrateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accesToken = await user.genrateAccessToken();
        const refreshToken = await user.genraterefreshToken();
        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });
        return { accesToken, refreshToken };
    } catch (error) {
        throw ApiError(500, " Something went wrong refresh and access token ");
    }
};

const registerUser = asyncHandler(async (req, res, next) => {
    
    const { username, email, fullName, password } = req.body;

    if (
        [username, email, fullName, password].some(
            (fields) => fields?.trim() === "" || undefined
        )
    ) {
        throw new ApiError(400, "all fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username allready existed");
    }

    const avatartLocalPath = req.files?.avatar[0]?.path;

    let coverImagelocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImagelocalPath = req.files.coverImage[0].path;
    }

    if (!avatartLocalPath) {
        throw ApiError(400, "Avatar file is requried");
    }

    const avatar = await uploadOnCloudinary(avatartLocalPath);
    const coverImage = await uploadOnCloudinary(coverImagelocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is requried");
    }

    const user = await User.create({
        fullName,
        avatar: { publicId:avatar.public_id , url:avatar.url },
        coverImage: { publicId:coverImage.public_id , url: coverImage.url },
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken "
    );

    if (!createdUser) {
        throw new ApiError(500, "Somethind wencomt wrong while registering a User");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "user Created successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, " username or password is required ");
    }

    const user = await User.findOne({
        $or: [
            {
                username,
            },
            {
                email,
            },
        ],
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    const isMatch = await user.isPasswordCorrect(password);

    if (!isMatch) {
        throw new ApiError(401, " Invlid user credintails ");
    }

    const { refreshToken, accesToken } = await genrateAccessAndRefreshTokens(
        user._id
    );
    //    console.log(refreshToken)
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken "
    );

    const cookieOptions = {
        httpOnly: true, // Makes the cookie inaccessible to JavaScript
        // secure: true, // Sends cookie only over HTTPS
    };

    return res
        .status(200)
        .cookie("accessToken", accesToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    refreshToken,
                    accesToken,
                },
                "User logged In Successfully"
            )
        );
});


const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1, // it will remove refresh token from the document
            },
        },
        { new: true }
    );

    const cookieOptions = {
        httpOnly: true,
        // secure:true
    };
    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new ApiResponse(200, {}, "user logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, " Unauthrized Request ");
    }

    try {
        const decodedToken = await jwt.sign(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, " Invalid Refresh Token ");
        }

        if (incomingRefreshToken !== user?.refreshAccessToken) {
            throw new ApiError(401, "  Refresh Token is Expired or used  ");
        }

        const cookieOptions = {
            httpOnly: true,
            // secure:true
        };

        const { accesToken, newRefreshToken } = await genrateAccessAndRefreshTokens(
            user._id
        );

        return res
            .status(200)
            .cookie("accessToken", accesToken, cookieOptions)
            .cookie("refreshToken", newRefreshToken, cookieOptions)
            .json(
                new ApiResponse(
                    200,
                    { accesToken, refreshToken: newRefreshToken },
                    "refresh Token refreshed"
                )
            );
    } catch (error) {
        throw ApiError(401, error?.message || " Invalid refresh token ");
    }
});



const changeCurrenPassword = asyncHandler(async (req, res) => {
    const { newPassword, oldPassword } = req.body;
    const id = req.user?._id;

    const user = await User.findById(id);
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (isMatch) {
        throw new ApiError(400, "invalid old Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "password has been changed successfully "));
});


const getCurrentUser = asyncHandler(async (req, next) => {
    return res
        .status(200)
        .json(new ApiResponse(200, { data: req.user }, " User information "));
});


const updateAccountDetails = asyncHandler(async (req, next) => {
    const { fullName, email } = req.body;

    if (!(fullName || email)) {
        throw new ApiError(400, "fullName or email is required ");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
            },
        },
        { new: true }
    ).select("-password");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { data: user },
                "password has been changed successfully "
            )
        );
});



const updateUserAvatar = asyncHandler(async (req, res) => {
    
    const avatartLocalPath = req.file?.path
   
    if (!avatartLocalPath) {
        throw new ApiError(400, " Avatar file is Missing ");
    }
   
    const avatar = await uploadOnCloudinary(avatartLocalPath);

    if (!avatar) {
        throw new ApiError(400, " Error while uploading on avatart ");
    }

    const user = await User.findById(req.user?._id,).select(" -passworrd -refreshToken ");

    if(!user){
        throw new ApiError(404," User Not Found ")
    }
     
    const previousImagePublicId = user.avatar.publicId;

    await delteOnCloudinray(previousImagePublicId);

    user.avatar.publicId = avatar.public_id;
    user.avatar.url = avatar.url

    await user.save( { validateBeforeSave:false } )


    return res
        .status(200)
        .json(
            new ApiResponse(200, { user: user }, " User Avatar image is updated ")
        );
});



const updateUserCoverImage = asyncHandler(async (req, res) => {
    
    const covertLocalPath = req.file?.path;

    if (!covertLocalPath) {
        throw new ApiError(400, " Avatar file is Missing ");
    }
    
    
    const coverImage = await uploadOnCloudinary(covertLocalPath);

    if (coverImage.path) {
        throw new ApiError(400, " Error while uploading on coverImage ");
    }

    const user = await User.findById(req.user?._id).select(" -passworrd -refrehToken ");

    if(!user){
        throw new ApiError(404," User Not Found ")
    }
    
    const previousCoverImagePublicId = user.coverImage.publicId;

    await delteOnCloudinray(previousCoverImagePublicId);

    user.coverImage.publicId = coverImage.public_id;
    user.coverImage.url = coverImage.url;

    await user.save( { validateBeforeSave:false } );


    return res
        .status(200)
        .json(new ApiResponse(200, { user: user }, "User Cover image is updated "));
});




const getUserChannelProfile = asyncHandler(async (req, res) => {
    
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, " username is missing ");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subsriber",
                as: "subscriberTo",
            },
        },
        {
            $addFields: {
                subscrobersCount: {
                    $size: "$subscribers",
                },
                channelSucbscribedToCount: {
                    $size: "$subscriberTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscrobersCount: 1,
                channelSucbscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(400, " channel does not exist ")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, channel[0], "user channel fetched successfully")
        )
});


const getWatchHistory = asyncHandler(async(req,res)=>{

    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
               $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner", //overright on this field
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
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                    
                ]
            }
        }
    ]);

    res
    .status(200)
    .json(
        new ApiResponse(200,user[0].wathHistory,"watch history fetched successfully")
    )
})





export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrenPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
