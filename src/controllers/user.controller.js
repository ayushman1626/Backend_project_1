import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler( async (req,res)=> {
    // res.status(200).json({
    //     message: "Ok"
    // })

//algo
    //get all details from frontend
    //validation - not empty
    //check if already registerd or not : email and username
    //check for coverImage
    //check for avatar
    //upload to cloudinary
    //create user object -- db entry
    //check fro response : user created or not 
    //remove password and refresh token from response
    //return the object to frontend


    const {fullName,email,username,password} = req.body;
    
    //validation

    if(fullName === ""|| email === "" || username === ""|| password === ""){
        throw new ApiError(400, "All fields are required");
    }

    //checking if the user already registerd
    const userExist = User.findOne({
        $or:[ { username }, { email } ]
    }) 
    if(userExist){
        throw new ApiError(409,"User with same email or username already exist");
    }

    //check for iamges
    const avatarLopcalPath = res.files?.avatar[0]?.path;
    const coverImageLopcalPath = res.files?.coverImage[0]?.path;

    if(!avatarLopcalPath){
        throw new ApiError(400, "avatar field is required");
    }

    //uploading to cloudinary
    const avatar = await uploadOnCloudinary(avatarLopcalPath);
    const coverImage = await uploadOnCloudinary(coverImageLopcalPath);

    if(!avatar){
        throw new ApiError(400, "avatar field is required");  //cloudinary upload is failed
    }


    //upload to db
    const user = await User.create({
        username : username.toLowerCase(),
        email,
        fullname,
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        password
    })


    //checking user created or not and removing password and refreshToken field
    const createdUser =  await User.findById(user._id).select( "-password -refreshToken" );

    if(!createdUser) throw new ApiError(500, "Something went Wrong while creating User");

    return res.status(200).json(
        new ApiResponse(200, createdUser, "Succesfully Registered")
    )
} )



export { registerUser }