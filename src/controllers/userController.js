import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt  from "jsonwebtoken";

const genrateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accesToken = await user.genrateAccessToken();
        const refreshToken = await user.genraterefreshToken();
        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave:false });
        return { accesToken ,refreshToken }
    } catch (error) {
        throw ApiError(500," Something went wrong refresh and access token ")
    }
}


const registerUser = asyncHandler(async (req, res , next) => {

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
    
    const avatartLocalPath = req.files?.avatar[0]?.path; 
 
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



const loginUser = asyncHandler( async(req,res) => {
        
        const { email , username , password } = req.body

        if(!username && !email){
            throw new ApiError(400,' username or password is required ')
        };
        
        const user = await User.findOne({
            $or:[
                {
                    username
                },
                {
                    email
                }
            ]
        });

        if(!user){
            throw new ApiError(404,"User does not exist");
        };

        const isMatch = await user.isPasswordCorrect(password);

        if(!isMatch){
            throw new ApiError(401," Invlid user credintails ");
        };

       const { refreshToken , accesToken } =  await genrateAccessAndRefreshTokens(user._id);
    //    console.log(refreshToken)
       const loggedInUser = await User.findById(user._id).select('-password -refreshToken '); 
       
       const cookieOptions = {
        httpOnly: true, // Makes the cookie inaccessible to JavaScript
        // secure: true, // Sends cookie only over HTTPS
      }

       return res
       .status(200)
       .cookie("accessToken",accesToken,cookieOptions)
       .cookie("refreshToken", refreshToken,cookieOptions)
       .json( new ApiResponse (200, {
        user : loggedInUser , refreshToken , accesToken,
        },
        "User logged In Successfully"
        ))
} );



const logOutUser = asyncHandler( async (req,res) => {
       
        await User.findByIdAndUpdate(req.user._id,{
                $set:{
                    refreshToken:""
                }
            },{new:true});
        
            const cookieOptions = {
                httpOnly:true,
                // secure:true
               } ;
        return res
        .status(200)
        .clearCookie("accessToken",cookieOptions)
        .clearCookie("refreshToken",cookieOptions)
        .json( new ApiResponse(200,{},"user logged Out"));

} )

const refreshAccessToken = asyncHandler( async(req,res)=> {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken 

    if(!incomingRefreshToken){
        throw new ApiError(401," Unauthrized Request ")
    }

   try {

     const decodedToken = await jwt.sign(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
         )
 
     const user = await User.findById(decodedToken?._id); 
 
     if(!user){
         throw new ApiError(401," Invalid Refresh Token ")
     }
 
     if(incomingRefreshToken !== user?.refreshAccessToken ){
         throw new ApiError(401,"  Refresh Token is Expired or used  ")
     }
 
     const cookieOptions = {
         httpOnly:true,
         // secure:true
        } ;
 
     const {accesToken ,newRefreshToken} = await genrateAccessAndRefreshTokens(user._id)
 
     return res
     .status(200)
     .cookie("accessToken",accesToken,cookieOptions)
     .cookie("refreshToken",newRefreshToken,cookieOptions)
     .json(
         new ApiResponse(
             200,
             {accesToken , refreshToken:newRefreshToken},
             "Accessed Token refreshed"
         )
     )
   } catch (error) {
     throw ApiError(401,error?.message || " Invalid refresh token ")
   }

} )

const changeCurrenPassword = asyncHandler( async(req,res) => {

    const { newPassword , oldPassword } = req.body 
    const id = req.user?._id

    const user = await User.findById(id);
    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (isMatch) {
        throw new ApiError(400,"invalid old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false});

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"password has been changed successfully ")
    )
   
})

const getCurrentUser = asyncHandler( async(req,next)=> {
    return res
    .status(200)
    .json(
        200,
        {user:req.user},
        "current User"
    )
})

const updateAccountDetails = asyncHandler( async(req,next)=> {
    
    const { fullName , email } = req.body

    if( !(fullName || email) ){
        throw new ApiError(400,"fullName or email is required ")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}

    ).select("-password")

    return res
    .status(200)
    .json(
        200,
        {user:user},
        "current User Details"
    )
})


const updateUserAvatar = asyncHandler( async(req,next)=> {
    
    const avatartLocalPath = req.file?.path


    if( avatartLocalPath ){
        throw new ApiError(400," Avatar file is Missing ")
    }

    const avatar =  await uploadOnCloudinary(avatartLocalPath)

    if(avatar.path){
        throw new ApiError(400," Error while uploading on avatart ")   
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
            $set:{
             avatar:avatar.url
            }
    },{new:true}).select("-passworrd");

    await user.save()

    return res
    .status(200)
    .json(
        200,
        {user:user},
        " avatar image updated successfully "
    )
})


const updateUserCoverImage = asyncHandler( async(req,next)=> {
    
    const covertLocalPath = req.file?.path


    if( covertLocalPath ){
        throw new ApiError(400," Avatar file is Missing ")
    }

    const coverImage =  await uploadOnCloudinary(covertLocalPath)

    if(coverImage.path){
        throw new ApiError(400," Error while uploading on coverImage ")   
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{
            $set:{
                coverImage:coverImage.url
            }
    },{new:true}).select("-passworrd");

    await user.save()

    return res
    .status(200)
    .json(
        200,
        {user:user},
        " cover image updated successfully "
    )
})

export { 

    registerUser ,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrenPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};
