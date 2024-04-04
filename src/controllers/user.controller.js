import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/User.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/APiResponse.js'

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
    const cover_imageLocalPath = req.files.cover_image[0]?.path

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
        cover_image: cover_image.url? cover_image.url : "",
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

export {registerUser}