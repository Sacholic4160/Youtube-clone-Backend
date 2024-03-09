import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config(
    {
 cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
 api_key: process.env.CLOUDINARY_API_KEY,
 api_secret:process.env.CLOUDINARY_API_SECRET
    }
);

const uploadOnCloudinary = async (localFilePath) => {
   try {
    //if path does not exist then
    if(!localFilePath) return "localPath of file does not exist";

    //if path exist then we can move ahead
    const response = await cloudinary.uploader.upload(localFilePath,{
        resource_type:"auto"  //the upload method here consist of many options we can write here as one of them is the type of our file
    })
    console.log(`file has been uploaded successfully on cloudinary: ${response.url}`);
    return response;

   } catch (error) {
    fs.unlinkSync(localFilePath)  //remove the locally save temporary file as the upload operation got failed
    return null;
   }


}