import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
// import { createElement } from "react";
import { ApiResponse } from "../utils/ApiResponse.js";

// token generator method
const generateAccessAndRefreshToken = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return {accessToken , refreshToken}
    } catch (error) {
        throw new ApiError(500 , "Error: Something went wrong while generating tokens")
    }
}

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

const loginUser = asyncHandler(async (req,res) => {
    // step 1: take data from request body
    const [email , username, password] = req.body
    if(!username || !email){
        throw new ApiError(400 , "Username and email are required")
    }

    // step 2: find user and email in database
    User.findOne({
        $or : [{username} , {email}]
    })
    if(!user){
        throw new ApiError(404 , "User not found with this email or username")
    }
    // step 3: compare password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid password")
    }

    // step 4: generate access token and refresh token
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    // step 5: return response to user
    const loogedInUser = await User.findById(user._id) .select("-password -refreshToken")

    // step 6: send cookies
    const options = {
        httpOnly: true,
        secure: true
     }
     return res.status(200).cookie("accessToken" , accessToken , options)
        .cookie("refreshToken" , refreshToken , options)
        .json(new ApiResponse(200 , 
            {
                user: loggedInUser,
                accessToken,
                refreshToken},
               "User logged in successfully"
            
        ))

})

// logout user
const logOutUser = asyncHandler(async (req,res) => {
    User.findByIdAndUpdate(req.user._id , {
        $set: {
            refreshToken: undefined
        },
        },
        {new: true}
    )
        const options = {
        httpOnly: true,
        secure: true
     }
        return res.status(200).clearCookie("accessToken" , options)
        .clearCookie("refreshToken" , options)
        .json(new ApiResponse(200 , null , "User logged out successfully"))
    })
export {registerUser}
export {loginUser}
export {logOutUser}