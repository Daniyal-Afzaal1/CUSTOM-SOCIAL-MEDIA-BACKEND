import { asyncHandler } from "../utils/asyncHandler.js";
import { isEmpty, isEmailCorrect } from "../validations/common.validation.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const data = [username, email, password, fullName];
    const fields = ["username", "email", "password", "fullName"]

    for (let i = 0; i < data.length; i++) {
        if (isEmpty(data[i])) {
            throw new ApiError(400, `${fields[i]} cannot be empty`);
            break;
        }
    }

    if (!isEmailCorrect(email)) {
        throw new ApiError(400, "Provide correct email");
    }

    const usernameExists = await User.findOne({ username });  //conflicts error = 409
    if (usernameExists) {
        throw new ApiError(409, "username already exists");
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
        throw new ApiError(409, "email already exists");
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const avatarResponse = await uploadOnCloudinary(avatarLocalPath);

    if (!avatarResponse) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    let coverImageResponse = null;
    if (coverImageLocalPath) {
        coverImageResponse = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImageResponse) {
            throw new ApiError(500, "Error while uploading coverImage");
        }
    }


    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        password,
        avatar: avatarResponse.url,
        coverImage: coverImageResponse?.url || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Error while registering the user");
    }

    res.status(201).json(
        new ApiResponse(201, createdUser, "User Successfully registered")
    )            //201: created, client request succeeded and created one or more resources on server



})

export { registerUser }
/*
     1. Receive user data
     2. Validate the data
     3. Check whether user already exists
     4. Receive/check uploaded files
     5. Upload images to Cloudinary
     6. Check Cloudinary upload
     7. Create user in MongoDB
     8. Remove sensitive fields
     9. Verify user creation
     10. Send a structured response
    */