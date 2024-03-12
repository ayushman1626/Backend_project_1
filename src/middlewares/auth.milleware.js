import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;

require('dotenv').config({path : './.env'}) 




const verifyJWT = asyncHandler( async (req, res, next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    // console.log((token));
     if (!token) {
         throw new ApiError(400, "Unauthorized user")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCERSS_TOKEN_SECRET)
    //  console.log(decodedToken);
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    //  console.log(user);
     if (!user) {
         throw new ApiError(401, "Invalid refreshToken");
     }
 
     req.user = user;
     next()
   } catch (error) {
        throw new ApiError(409, error?.message || "Invalid refreshToken")
   }
})

export {verifyJWT}