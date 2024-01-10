import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({
  cloud_name: "dgvnvi6wk",
  api_key: "677599397488387",
  api_secret: "LlYns2719923Sd6SToZNlMbrcbo",
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return error;
    }
}



export {uploadOnCloudinary}
