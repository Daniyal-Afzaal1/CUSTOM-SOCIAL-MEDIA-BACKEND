import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/likes.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//toggle like on video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim() || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const alreadyExists = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    })

    if (alreadyExists) {
        await Like.deleteOne({ _id: alreadyExists._id })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "unliked video successfully")
            )
    }

    const like = await Like.create({
        video: videoId,
        likedBy: req.user._id,
    })

    if (!like) {
        throw new ApiError(400, "error while creating like");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, like, "Like on video created successfully")
        )

})

//toggle like on comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId?.trim() || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment id")
    }

    const alreadyExists = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    })

    if (alreadyExists) {
        await Like.deleteOne({ _id: alreadyExists._id })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "unliked comment successfully")
            )
    }

    const like = await Like.create({
        comment: commentId,
        likedBy: req.user._id,
    })

    if (!like) {
        throw new ApiError(400, "error while creating like");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, like, "Like on comment created successfully")
        )


})

// toggle like on tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId?.trim() || !isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const alreadyExists = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    })

    if (alreadyExists) {
        await Like.deleteOne({ _id: alreadyExists._id })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "unliked tweet successfully")
            )
    }

    const like = await Like.create({
        tweet: tweetId,
        likedBy: req.user._id,
    })

    if (!like) {
        throw new ApiError(400, "error while creating like");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, like, "Like on tweet created successfully")
        )
}
)

//get all liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: req.user._id
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as: "video"
            }
        },
        {
            $unwind : "$video"
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos,"successfully retreived the liked videos")
    )
})



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}  