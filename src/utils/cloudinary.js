import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

   cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
    
const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) {
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log(
            "file has been successfully uploaded on cloudinary: " +
            response.url
        );

        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const delete_from_cloudinary = async function(public_id, resource_type = "image"){
    try {
        if(!public_id){
            return null;
        }
        const response = await cloudinary.uploader.destroy(public_id, {
            resource_type
        });
    
        return response;
    } catch (error) {
        console.log("Error while deleting file from cloudinary: ", error);
        return null;
    }
};


export {uploadOnCloudinary, delete_from_cloudinary}; 