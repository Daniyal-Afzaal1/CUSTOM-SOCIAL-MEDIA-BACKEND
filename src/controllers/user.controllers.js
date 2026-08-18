import { asyncHandler } from "../utils/asyncHandler.js";
import { isEmpty, isEmailCorrect } from "../validations/common.validation.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary, delete_from_cloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { Video } from "../models/video.model.js";


const generate_Access_And_Refresh_Token = async (userID) => {

    try {
        const user = await User.findById(userID);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false  //Mongoose will not check if required fields are missing or if data types are wrong
        })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh Tokens");
    }

};

//registerUser
const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password, fullName } = req.body;
    const data = [username, email, password, fullName];
    const fields = ["username", "email", "password", "fullName"]


    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    // console.log(req.body);    

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
    const emailExists = await User.findOne({ email });

    if (usernameExists && emailExists) {
        fs.unlinkSync(avatarLocalPath);  //if conflict, remove the resources from local server
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(409, "Email and username, both are already taken");

    }

    if (usernameExists) {
        throw new ApiError(409, "username already exists");
        fs.unlinkSync(avatarLocalPath);
        fs.unlinkSync(coverImageLocalPath);
    }

    if (emailExists) {
        throw new ApiError(409, "email already exists");
        fs.unlinkSync(avatarLocalPath);
        fs.unlinkSync(coverImageLocalPath);
    }

    // console.log(req.files);


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
        avatar: avatarResponse?.secure_url,
        avatar_public_id: avatarResponse?.public_id,
        coverImage: coverImageResponse?.secure_url || "",
        coverImage_public_id: coverImageResponse?.public_id || ""
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        delete_from_cloudinary(avatarResponse?.public_id);
        delete_from_cloudinary(coverImageResponse?.public_id);
        throw new ApiError(500, "Error while registering the user");
    }

    res.status(201).json(
        new ApiResponse(201, createdUser, "User Successfully registered")
    )            //201: created, client request succeeded and created one or more resources on server



});

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

//i think i can do something like because the images are upladed on local machine in the router so if 
//error occurs inside the username and email conflict it means the images are still on local and they need to be deleted

//login
const LoginUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User credentials") //401: it lacks valid authentication credentials
    }

    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(user._id);

    const options = {
        httpOnly: true,  //JavaScript cookie access restriction at client side(browser)
        secure: true  //browser should send cookies over HTTPS 
    };

    const userToSend = await User.findOne(user._id).select("-password -refreshToken");

    res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    userToSend,               //front end might need email,avatar or username
                    accessToken,
                    refreshToken
                },
                "User loggedIn successfully"
            )
        );

});

//logout
const LogoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
            $set: { //set operator
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    };

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "user logout successfully"
            )
        );


});

//refresh the access token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decoded_token = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh token");
    }

    const user = await User.findById(decoded_token?._id);

    if (!user) {
        throw new ApiError(401, "Invalid Refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Invalid refresh token");
    }

    const { accessToken, refreshToken } = await generate_Access_And_Refresh_Token(user._id);

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                { accessToken, refreshToken },
                "access token refreshed"
            )
        )

});

//change the old password
const change_current_password = asyncHandler(async (req, res) => {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
        throw new ApiError(401, "passwords are required");
    }

    const user = await findById(req.user._id);

    const isPasswordValid = await user.isPasswordCorrect(old_password);

    if (!isPasswordValid) {
        throw new ApiError(400, "old password you have given is incorrect");
    }

    user.password = new_password;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password changed successfully")
        )

});

//get current user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "successfully retreived current user")
        )
});

//updated email and full Name
const update_account_details = asyncHandler(async (req, res) => {
    const { email, fullName } = req.body;

    if (!email || !fullName) {
        throw new ApiError(400, "provide all the fields to update");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                email,
                fullName
            }
        },
        { new: true }
    ).select("-password");

    if (!user) {
        throw new ApiError(500, "Error updating the fields");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Account updated successfully"
            )
        )
});

//updates avatar
const update_avatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar file is missing");
    }

    const new_avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!new_avatar) {
        throw new ApiError(500, "Error while uploading avatar");
    }

    const user_with_old_avatar = await User.findById(req.user._id);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: new_avatar.secure_url,
                avatar_public_id: new_avatar.public_id
            }
        },
        { new: true }
    ).select("-password");

    if (!user) {
        delete_from_cloudinary(new_avatar.public_id);
        throw new ApiError(500, "Error while updating avatar");
    }

    delete_from_cloudinary(user_with_old_avatar.public_id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar uploaded successfully")
        )

});

//updates cover image
const update_coverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        new ApiError(401, "cover image file is missing");
    }

    const new_coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!new_coverImage) {
        throw new ApiError(500, "Error while uploading cover image");
    }

    const user_with_old_coverImg = await User.findById(req.user._id);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: new_coverImage.secure_url,
                coverImage_public_id: new_coverImage.public_id
            }
        },
        { new: true }
    ).select("-password");

    if (!user) {
        delete_from_cloudinary(new_coverImage.public_id);
        throw new ApiError(500, "Error while updating avatar");
    }

    delete_from_cloudinary(user_with_old_coverImg.public_id);

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "cover image uploaded successfully")
        )

});

//get user channel profile
const get_user_channel_profile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(401, "username is missing");
    }

    const channel = await User.aggregate([ //return [{},{},{}]
        {
            $match: {   //mactch: i need to find something
                username: usernmae?.toLowerCase()
            }
        },
        {
            $lookup: { //lookup:i need info from another collection, returns [{},{},{}]
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: { //addFields: i need to create/calculate something
                subscriberCount: {
                    $size: $subscribers //Count items in an array
                },
                channelsSubscribedToCount: {
                    $size: $subscribedTo
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },  //in: Check whether something exists
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: { //project: Select/remove fields
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                email: 1
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404, "channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0], "User channel fetched successfully")
    )
})

//get watch history
const get_watch_history = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        avatar : 1,
                                        username : 1,
                                        fullName : 1
                                    }
                                },
                                {
                                    $addFields : { //to gove this format : owner : {...}
                                        owner : {
                                            $first : "$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0]?.watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    LoginUser,
    LogoutUser,
    refreshAccessToken,
    change_current_password,
    getCurrentUser,
    update_account_details,
    update_avatar,
    update_coverImage,
    get_user_channel_profile,
    get_watch_history
};
