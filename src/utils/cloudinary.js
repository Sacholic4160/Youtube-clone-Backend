import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


          
cloudinary.config({ 
  cloud_name: 'dpox4drsw', 
  api_key: '654613913124377', 
  api_secret: '1OAEFB8DF2dWrHRxItcSBsiOnbk' 
});
const uploadOnCloudinary = async (localFilePath) => {
  try {
    //if path does not exist then
    if (!localFilePath) return "localPath of file does not exist";

    //if path exist then we can move ahead
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"//the upload method here consist of many options we can write here as one of them is the type of our file
    });
    console.log(
      `file has been uploaded successfully on cloudinary: ${response.url}`
    );
    fs.unlinkSync(localFilePath);
    return response;

  }
   catch (error) {
    fs.unlinkSync(localFilePath); //remove the locally save temporary file as the upload operation got failed
    return null;
  }
};

export {uploadOnCloudinary};