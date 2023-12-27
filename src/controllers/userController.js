import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const genrateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accesToken =  user.genrateAccessToken();
        const refreshTOken =  user.genraterefreshToken();
        user.refreshTOken = refreshTOken
        await user.save({ validateBeforeSave:false });
        return { accesToken ,refreshTOken }
    } catch (error) {
        throw ApiError(500," Something went wrong refresh and access token ")
    }
}


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



const loginUser = asyncHandler( async(req,res,next) => {
        

        const { email , username , password } = req.body

        if(!username || !email){
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

       const { refreshTOken , accesToken } =  await genrateAccessAndRefreshToken(user._id);

       const loggedInUser = await User.findById(user._id).select('-password -refreshToken '); 

       const options = {
        httpOnly:true,
        secure:true
       } ;

       return res.status(200)
       .cokkie( 'accessToken',accesToken,options)
       .cokkie("refreshToken",refreshTOken,options)
       .json( new ApiResponse (200, {
        user : loginUser , refreshTOken , accesToken,
        },
        "User logged In Successfully"
        ))
} );



const logOutUser = asyncHandler( async (req,res) => {
     
        await User.findByIdAndUpdate(req.user._id,{
                $set:{
                    refreshTOken:undefined
                }
            },{new:true});
        
            const options = {
                httpOnly:true,
                secure:true
               } ;
        return res
        .status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken",options)
        .json( ApiResponse(200,{},"user logged Out"))

} )



export { 

    registerUser ,
    loginUser,
    logOutUser
};
