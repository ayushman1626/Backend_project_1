import { v2 as cloudinary } from 'cloudinary' 
import { response } from 'express';
import fs from "fs"

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        //fils has been uploaded succesfully
        console.log("fils has been uploaded succesfully", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);   //removes fild from the local server storage as the file upload failed

    }
}



export {uploadOnCloudinary}