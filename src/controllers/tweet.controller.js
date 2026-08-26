import mongoose from "mongoose"
import { Tweet } from "../models/tweets.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//create tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "content cannot be empty")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id
    });

    if (!tweet) {
        throw new ApiError(500, "Error while creating tweet")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, tweet, "Tweet created successfully")
        )

})

//get user tweets
const getUserTweets = asyncHandler(async (req, res) => {
    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: req.user._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                avatar: "$owner.avatar",
                username: "$owner.username",
                fullName: "$owner.fullName"
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweets, "sent user tweets successfully")
        )
})

//update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { tweetId } = req.params;

    if (!content?.trim()) {
        throw new ApiError(400, "content cannot be empty")
    }

    const userCheck = await Tweet.findById(tweetId);

    if (!userCheck) {
        throw new ApiError(404, "Tweet not found");
    }

    if (!userCheck.owner.equals(req.user._id)) {
        throw new ApiError(401, "Unauthorized Access")
    }

    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            content: content
        },
        { new: true }
    );

    if (!tweet) {
        throw new ApiError(500, "Error while updating tweet")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, tweet, "tweet updated successfully")
        )

})

//delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!tweetId?.trim() || !mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400,"Invalid tweet id")
    }

    const userCheck = await Tweet.findById(tweetId);

    if(!userCheck){
        throw new ApiError(400, "tweet not found")
    }

    if(!userCheck.owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorrized access")
    }

    const tweet = await Tweet.findByIdAndDelete(tweetId);

    if(!tweet){
        throw new ApiError(400,"Error while deleting tweet")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
