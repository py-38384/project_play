// import { v2 as cloudinary } from "cloudinary"
// import fs from "fs"
// import path from "path";
// import { BASEDIR } from '../../base.dir.js'


// cloudinary.config({
//     cloud_name: process.env.CLUUDINARY_CLOUD_NAME,
//     api_key: process.env.CLUUDINARY_API_KEY,
//     api_secret: process.env.CLUUDINARY_API_SECRET,
// });

// const uploadOnCloudinary = async (localFilePath, remoteFilePath) => {
//     try{
//         if (!localFilePath) return null
//         const response = cloudinary.uploader.upload(localFilePath,{
//                 resource_type: "auto",
//                 folder: `play/${remoteFilePath}`, 
//             })
//         console.log(`Debug: ${path.join(BASEDIR,localFilePath)}`)
//         fs.unlinkSync(path.join(BASEDIR,localFilePath))
//         return response;
//     } catch (error) {
//         fs.unlinkSync(path.join(BASEDIR,localFilePath)) // remove the locally saved temporary file as the upload operation failed
//     }
// }

// export {uploadOnCloudinary}


import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET 
// });
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, des) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: `play/${des}`,
        })
        // file has been uploaded successfull
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log('Debug: ',error)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}