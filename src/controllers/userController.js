import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {

    const { username, email, fullName, password } = req.body;

    if (
        [username, email, fullName, password].some(
            (fields) => fields?.trim() === ""
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

    const avatartLocalPath = req.files?.avatar[0]?.path; // extract avatar first property it gives us a object from files
 
    // const coverImagelocalPath = req.files?.coverImage[0]?.path;
    
    let coverImagelocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImagelocalPath = req.files.coverImage[0].path
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
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findOne(user._id).select(
        "-password -refreshToken "
    );

    if (!createdUser) {
        throw new ApiError(500, "Somethind went wrong while registering a User");
    }

    return res
        .status(201)
        .json(new ApiResponse(200, createdUser, "user Created successfully"));
});

export { registerUser };
