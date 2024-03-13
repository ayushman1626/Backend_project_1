import { v2 as cloudinary } from "cloudinary"
// import { response } from 'express';
import fs from "fs"


import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;

require('dotenv').config({path : './.env'}) 



          
cloudinary.config({ 
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`, 
  api_key: `${process.env.CLOUDINARY_API_KEY}`, 
  api_secret: `${process.env.CLOUDINARY_API_SECRET}`
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const response =  await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        //fils has been uploaded succesfully
        // console.log("fils has been uploaded succesfully", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); 
        console.log(error);  //removes fild from the local server storage as the file upload failed
    }
}


const deleteFromCloudinary = async (cloudinaryUrl) => {
    try {
        cloudinary.uploader
        .destroy(cloudinaryUrl)
        // .then(result => console.log(result));
    } catch (error) {
        console.log(error || "cloudinary delete incomplete");  //removes fild from the local server storage as the file upload failed
    }
}


export {uploadOnCloudinary, deleteFromCloudinary}