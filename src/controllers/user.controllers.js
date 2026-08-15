import { asyncHandler } from "../utils/asyncHandler.js";
import { isEmpty, isEmailCorrect } from "../validations/common.validation.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";

const generate_Access_And_Refresh_Token = async(userID) => {

    try {
        const user = await User.findById(userID);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
    
        await user.save({
            validateBeforeSave: false  //Mongoose will not check if required fields are missing or if data types are wrong
        })
    
        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh Tokens");
    }

}

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

    if(usernameExists && emailExists){
        fs.unlinkSync(avatarLocalPath);  //if conflict, remove the resources from local server
        fs.unlinkSync(coverImageLocalPath);
        throw new ApiError(409,"Email and username, both are already taken");
         
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
     const LoginUser = asyncHandler(async (req,res) => {
        const {username,email,password} = req.body;
        
        if(!username && !email){
            throw new ApiError(400,"Username or email is required");
        }

        const user = await User.findOne({
            $or : [
                {username},
                {email}
            ]
        });

        if(!user){
            throw new ApiError(404, "User does not exists");
        }

        const isPasswordValid = await user.isPasswordCorrect(password);

        if(!isPasswordValid){
            throw new ApiError(401,"Invalid User credentials") //401: it lacks valid authentication credentials
        }

        const {accessToken,refreshToken} = await generate_Access_And_Refresh_Token(user._id);

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
     const LogoutUser = asyncHandler(async (req,res) => {
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

    
     export { registerUser, LoginUser, LogoutUser }
