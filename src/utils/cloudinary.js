import { v2 as cloudinary } from "cloudinary"
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLUUDINARY_CLOUD_NAME,
    api_key: process.env.CLUUDINARY_API_KEY,
    api_secret: process.env.CLUUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null
        const response =cloudinary.uploader.upload(localFilePath,{
                resource_type: "auto",
            })
        console.log("fle is uploaded on cloudinary ",(await response).url)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation failed
    }
}

export {uploadOnCloudinary}
