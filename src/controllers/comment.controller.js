import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//get all comments for a video
const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const comments = await Comment.aggregate([
        {
            $match: {
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $skip: (pageNumber - 1) * limitNumber
        },
        {
            $limit: limitNumber
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                fullName: "$owner.fullName",
                username: "$owner.username"
            }
        }
    ])

    if (!comments) {
        throw new ApiError(500, "Error fetching comments")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, comments, "comments received successfully")
        )

})

//add a comment to a video
const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { content } = req.body;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid or missing videoId");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })

    res
        .status(201)
        .json(
            new ApiResponse(201, comment, "comment created successfully")
        )
})

//update a comment
const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid or missing commentId");
    }

    if (!content || !content.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const Commentuser = await Comment.findById(commentId);

    if(!Commentuser){
        throw new ApiError(404,"comment not found");
    }

    if(!req.user._id.equals(Commentuser.owner)){
        throw new ApiError(401, "Unauthorized access")
    }

    const comment = await Comment.findByIdAndUpdate(commentId, {content}, {new: true});

    if(!comment){
        throw new ApiError(404, "comment not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"comment updated successfully")
    )

})

//delete a comment
const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;

    if(!commentId || !mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid or missing commment Id")
    }

    const commentUser = await findById(commentId);

    if(!commentUser){
        throw new ApiError(404, "comment not found")
    }

    if(!req.user._id.equals(commentUser.owner)){
        throw new ApiError(401, "Unauthorized Access")
    }

    const response = await Comment.findByIdAndDelete(commentId);

    if(!response){
        throw new ApiError(404, "Comment not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"comment deleted successfully")
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}