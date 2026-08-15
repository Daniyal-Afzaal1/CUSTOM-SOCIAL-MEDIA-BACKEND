import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler(async(req,_,next) => {
    const token = req.cookies?.accessToken || 
    req.header("Authorization")?.replace("Bearer ", "");

    if(!token){
        throw new ApiError(401, "Unauthorized request");       //401: the server rejected your request because it lacks valid authentication credentials
    }

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401,"Invalid access token");
    } //verify vaidatity of token and decodes it

    /* 
    if we dont user try catch in using jwt.verify individually 
    our global error handler will receive the JWT library's error 
    instead of your custom ApiError
    */

    const user = await User.findById(decodedToken._id).select("-password -refreshToken");

    if(!user){
        throw new ApiError(401,"Invalid access token");
    }

    req.user = user;  //injected user credentials inside the req object so other contollers can know which user is making requests

    next();

});

export {verifyJWT}