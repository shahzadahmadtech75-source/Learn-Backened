import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDUINARY_CLOUD_NAME,
  api_key: process.env.CLOUDUINARY_API_KEY,
  api_secret: process.env.CLOUDUINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type: "auto"
            }
        )
        // console.log("File is uploaded on cloudinary.",response.url);
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temperory files as the operations got failed
        return null;
    }
}

export default uploadOnCloudinary