import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req,res,next) => {
    // step 1: get token from cookies
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
     if(!token){
         throw new ApiError(401 , "Access token is required")
     }
     // step 2: verify token
     const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken._id).select("-password -refreshToken")
     if (!user){
         throw new ApiError(401 , "Invalid access token")
     }
 
     req.user = user
     next
   } catch (error) {
    throw new ApiError(401 , error?.message ||  "Invalid or expired access token")
   }
})