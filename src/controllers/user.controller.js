import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/APiResponse.js'
import jwt from 'jsonwebtoken'

const generateAccessAndRefreshTokens = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const options = {
    httpOnly: true,
    secure: true
}

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    const {fullname, email, username, password} = req.body
    
    // validation - not empty
    // if(fullName === ""){
    //     throw new ApiError(400, "fullname is required")
    // }
    if([fullname, email, username, password].some((field) => (
        field.trim() === ""
    ))){
        throw new ApiError(400, "All fields are required")
    }

    // check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exist!")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    let cover_imageLocalPath
    if ( Array.isArray(req.files.cover_image) ){
        cover_imageLocalPath = req.files.cover_image[0].path
    }

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath,"users/images/avatar")
    const cover_image = await uploadOnCloudinary(cover_imageLocalPath,"users/images/cover_image")


    // create user object - create entry in db
    if (!avatar){
        console.log(avatar)
        throw new ApiError(400, "Avatar file Upload failed")
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        cover_image: cover_image ? cover_image.url : undefined,
        email,
        password,
        username: username.toLowerCase()
    })
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
})

const loginUser = asyncHandler(async (req, res)=>{
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie
    const { email, username, password } = req.body
    // console.log(`Debug: ${email}`)
    // console.log(`Debug: ${username}`)
    // console.log(`Debug: ${password}`)
    if (!(username || email)){
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({ 
        $or: [{username}, {email}]
    })

    if (user==null) {
        console.log(`Debug-user : ${user}`)
        throw new ApiError(401, "User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401, "invalid Password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const logged_in_user = await User.findOne(user._id).select("-password -refreshToken")

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: logged_in_user,
                accessToken,
                refreshToken,
            },
            "User logged In Sucessfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                    refreshToken: undefined
            },
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET
        )
        
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "User not found! Invalid refresh token")
        }
        
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token invalid or used")
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {newAccessToken, newRefreshToken},
                "Access token refresh successful"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    if(!(newPassword === confirmPassword)) {
        throw new ApiError(400, "Password does not matched")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully."
    ))

})

const  getCurrentUser = asyncHandler( async ( req, res ) => {
    return res
    .status(200)
    .json(ApiResponse(200, req.user, "current user fetched successfully."))
})

const updateAccountDetails = asyncHandler( async (req, res ) => {
    const {fullName, email} = req.body

    const user = await User.findById(req.user?._id).select("-password")

    if(!fullName && !email) {
        throw new ApiError(400, "Invalid request. atlest one field required.")
    }

    if (fullName) {
        user.fullname = fullName
    }

    if (email) {
        user.email = email
    }

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "User details update successful."
        )
    )

})

const updateUserAvatar = asyncHandler( async ( req, res ) => {
    const avatarlocalPath = req.file?.path

    if(!avatarlocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarlocalPath,"users/images/avatar")

    if (!avatar.url) {
        throw new ApiError(500, "Error while uploading on server")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar : avatar.url
            },
        },
        {
            new: true
        }
    ).select("-password")
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "Avatar  update successfully."
        )
    )
    
})

const updateCoverPhoto = asyncHandler( async ( req, res ) => {
    const updateCoverlocalPath = req.file?.path
    
    if(!updateCoverlocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    
    const cover_image = await uploadOnCloudinary(updateCoverlocalPath,"users/images/cover_image")

    if (!cover_image.url) {
        throw new ApiError(500, "Error while uploading on server")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                cover_image : cover_image.url
            },
        },
        {
            new: true
        }
    ).select("-password")
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {user},
            "Cover image update successfully."
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateCoverPhoto,
}