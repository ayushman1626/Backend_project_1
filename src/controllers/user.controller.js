import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { extractPublicId } from "cloudinary-build-url";

import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;


const generateAccessAndRefreshToken = async (userID) => {
    try {
        const user = await User.findById(userID);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something Went wrone while generating access and refresh tokens")
    }
}

const registerUser = asyncHandler(async (req, res) => {
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


    const { fullName, email, username, password } = req.body;
    // console.log(req.body.fullName);
    //validation
    if (
        [fullName, email, username, password].some((element) => { element?.trim() === "" })
    ) {
        throw new ApiError(400, "All fields are required");
    }


    //checking if the user already registerd
    const userExist = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExist) {
        throw new ApiError(409, "User with same email or username already exist");
    }

    //check for iamges

    const avatarLopcalPath = req.files?.avatar[0]?.path;

    var coverImageLopcalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLopcalPath = req.files?.coverImage[0]?.path;
    }


    if (!avatarLopcalPath) {
        throw new ApiError(400, "avatar field is required!!");
    }

    //uploading to cloudinary
    const avatar = await uploadOnCloudinary(avatarLopcalPath);
    const coverImage = await uploadOnCloudinary(coverImageLopcalPath);

    if (!avatar) {
        throw new ApiError(400, "avatar field is required**");  //cloudinary upload is failed
    }


    //upload to db
    const user = await User.create({
        username: username?.toLowerCase(),
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password
    })


    //checking user created or not and removing password and refreshToken field
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) throw new ApiError(500, "Something went Wrong while creating User");

    return res.status(200).json(
        new ApiResponse(200, createdUser, "Succesfully Registered")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    //get email and password 
    //search email in db
    //compair password
    //generate access and refresh token
    //send cookie

    const { email, username, password } = req.body;

    if (!(email || username)) {
        throw new ApiError(400, "username or email is required")
    }



    const userExist = await User.findOne({   //search if an User with this username or email exist or not 
        $or: [{ username }, { email }]
    })
    if (!userExist) {
        throw new ApiError(404, "User not exist");
    }


    const isPasswordValid = await userExist.isPasswordCorrect(password);  //checking if password is valid or ont : isPasswordCorrect mrthod is defined in user.model
    if (!isPasswordValid) {
        throw new ApiError(404, "Password Incorrect");
    }


    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(userExist._id);

    const loggedInUser = await User.findById(userExist._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User LoggedIn succesfully"
            )
        )

})


const logoutUser = asyncHandler(async (req, res) => {
    const userID = req.user._id;
    await User.findByIdAndUpdate(userID,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, { message: "loggedout succesfully" }, "Logged out succesfully")
        )

})



const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id)


        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken: accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})


const changePassword = asyncHandler(async (req, res) => {

    const bodyDetails = req.body;
    console.log(bodyDetails);
    const { oldPassword, newPassword } = bodyDetails;
    const user = await User.findById(req?.user._id)
    console.log((user));
    const isPasswordvalid = await user?.isPasswordCorrect(oldPassword);

    if (!isPasswordvalid) {
        throw new ApiError(400, "Invalid Password")
    }

    user.password = newPassword;
    // console.log((user));
    await user.save({ validateBeforeSave: false })

    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Succesfully Changed password")
        )
})



const getCurrentUser = asyncHandler(async (req, res) => {

    res.status(200)
        .json(
            new ApiResponse(200, req.user, "current user fetched succesfully")
        )

})

const updateDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req?.body
    if (!(fullName && email)) {
        throw new ApiError(400, "All fields are required")
    }
    const user = await User.findByIdAndUpdate(req?.user._id, {
        $set: {
            fullName: fullName,
            email: email
        }
    }, {
        new: true
    }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(
            new ApiResponse(200, { updated: user }, "Details updated successfully")
        )
})


const UpdateAvatar = asyncHandler(async (req, res) => {
    const avatarLopcalPath = req?.file?.path;
    if (!avatarLopcalPath) {
        throw new ApiError(400, "avatar filed is required")
    }

    const avatar = await uploadOnCloudinary(avatarLopcalPath);

    if(!avatar){
        throw new ApiError("500","something went wrong while uploading on cloudinary")
    }

    await deleteFromCloudinary(extractPublicId(req.user.avatar))
    // console.log((extractPublicId(req.user.avatar)));

    const avatarUrl = avatar.url;

    const user = await User.findByIdAndUpdate(req?.user?._id,
        {
            $set: {
                avatar : avatarUrl
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(
        new ApiResponse(200,{user},"avatar succesfully updated")
    )
    
})


const UpdateCoverImage = asyncHandler(async (req, res) => {
    const coverImageLopcalPath = req?.file?.path;
    if (!coverImageLopcalPath) {
        throw new ApiError(400, "avatar filed is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLopcalPath);

    if(!coverImage){
        throw new ApiError("500","something went wrong while uploading on cloudinary")
    }

    await deleteFromCloudinary(extractPublicId(req.user.coverImage))
    // console.log((extractPublicId(req.user.avatar)));

    const coverImageUrl = coverImage.url;

    const user = await User.findByIdAndUpdate(req?.user?._id,
        {
            $set: {
                coverImage : coverImageUrl
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res.status(200)
    .json(
        new ApiResponse(200,{user},"coverimage succesfully updated")
    )
    
})





export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateDetails,
    UpdateAvatar,
    UpdateCoverImage
}