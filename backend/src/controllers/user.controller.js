import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
// import { createElement } from "react";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req , res) => {
//    Step 1: get user details from frontend
    const {fullname,email,username,password} = req.body
    console.log("email: " , email);
    // Step 2:  validation
    // if(fullname == ""){
    //     throw new ApiError(400,"fullname is required")
    // }
    if(
        [
            fullname , email ,username , password
        ].some((feild) => {
            feild?.trim() === ""
        })
    ){
        throw new ApiError(400,"All feilds are required")
    }
    // Step 3: checking user already exists
    
    const existedUser  = await User.findOne({
        $or: [{username} ,{email}]
    })
    if(existedUser){
        throw new ApiError(409 , "User with email or username already exists")
    }

    // Step 4: checking images and avatars
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar image is required")
    }

    // Step 5: upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    // Step 6: check avtar exists or not
    if(!avatar){
        throw new ApiError(400 , "Avatar image is required")
    }
    // Step 7: MAke user object and enter to database
    const user = await User.create({
        fullname, 
        avatar : avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // negative sign means remove this feild
    )

    if(!createdUser){
        throw new ApiError(500 , "Something went wrong while registering the user")
    }

    // Step 8: return response 
    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User Registered Successfully"))
})

export {registerUser}