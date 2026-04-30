import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
// import { createElement } from "react";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import { app } from "../app.js";
import { useSyncExternalStore } from "react";

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
    const {email , username, password} = req.body
    console.log(`Passeord: ${password}`);
    
    if(!(username || email)){
        throw new ApiError(400 , "Username and email are required")
    }

    // step 2: find user and email in database
   const user = await User.findOne({
    $or: [{ username }, { email }]
})

if (!user) {
    throw new ApiError(404, "User not found with this email or username")
}
    // step 3: compare password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid password")
    }

    // step 4: generate access token and refresh token
    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

    // step 5: return response to user
    const loggedInUser = await User.findById(user._id) .select("-password -refreshToken")

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

    const refreshAccessToken = asyncHandler(async (req,res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
        if(!incomingRefreshToken){
            throw new ApiError(401,"Unauthorized request")
        }

     try {
           const decodedToken = jwt.verify(
               incomingRefreshToken,
               process.env.REFRESH_TOKEN_SECRET
           )
           const user = User.findById(decodedToken?._id)
           if(!user){
               throw new ApiError(401, "Invalid refresh Token")
           }
           if(incomingRefreshToken !== user?.refreshToken){
                throw new ApiError(401, "Refresh Token is Expired")
           }
   
           const options = {
           httpOnly: true,
           secure: true
        }
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshToken(user._id)
   
        return res
        .status(200)
        .cookie("accessToken" , accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
           new ApiResponse(
               200,
               {accessToken,newrefreshToken},
               "Access token refreshed"
           )
        )
     } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token");
        
     }
    })

    const changeCurrentPassword = asyncHandler(async(req,res) => {
        const {oldPassword, newPassword} = req.body
        const user = await User.findById(req.user?._id)
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

        if(!isPasswordCorrect){
            throw new ApiError(400, "Invalid Password")
        }

        user.password = newPassword
        await user.save({validateBeforeSave:false})

        return res.status(200)
        .json(new ApiResponse(200 , {},"Password changed Successfully"))

    })

const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullname,email} = req.body
    if(!(fullname || email)){
        throw new ApiError(400 , "All Feilds are required")
    }

    User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullname : fullname,
                email:email
            }
        },
        {new :true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Account Details Updated Successfully"))

})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, " Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new :true}
    ).select("-password")
     return res.status(200)
    .json(new ApiResponse(200,user,"Avatar Image Updated Successfully"))
    
    
})
c

const updateUserCoverImg = asyncHandler(async(req,res) => {
    const coverImgLocalPath = req.file?.path

    if(!coverImgLocalPath){
        throw new ApiError(400 , "Cover Image file is missing")
    }
    const coverImg = await uploadOnCloudinary(coverImgLocalPath)

    if(!coverImg.url){
        throw new ApiError(400, " Error while uploading on cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {new :true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
    
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const  {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400 , "Username is required")
    }
    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },

        {
            $lookup : {
                from : "Subscription",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "Subscription",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
            subscribersCount : {
            $size : "$subscribers" 
        },
        channelToCount : {
            $size : "$subscribedTo"
        },
        isSubscribed : {
            $cond : {
                if : {
                    $in : [req.user?._id , "$subscribers.subscriber"]}},
                then : true,
                else : false
        
        }
    },
},
{
    $project : {
        fullname : 1,
        username : 1,
        subscribersCount : 1,
        isSubscribed : 1,
        channelToCount : 1,
        avatar : 1,
        coverImage : 1,
        email : 1
    }
}
])

if(!channel?.length){
    throw new ApiError(404 , "Channel Does Not Exists")
}

return res.status(200)
.json(
    new ApiResponse(200 , channel[0] , "user channel fetched successfully")
)
})

export {registerUser}
export {loginUser}
export {logOutUser}
export {refreshAccessToken}
export {getCurrentUser}
export {updateAccountDetails}
export {changeCurrentPassword}
export {updateUserAvatar}
export {updateUserCoverImg}
export {getUserChannelProfile}