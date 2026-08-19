import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"

//get all videos based on query, sort, pagination
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = -1, userId } = req.query;

    const pipeline = [];

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const sortDirection = Number(sortType);

    // page validation
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
        throw new ApiError(400, "Page must be a positive integer");
    }

    // limit validation
    if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
        throw new ApiError(400, "Limit must be between 1 and 100");
    }

    // sortType validation
    if (sortDirection !== 1 && sortDirection !== -1) {
        throw new ApiError(400, "sortType must be 1 or -1");
    }

    // sortBy validation
    const allowedSortFields = [
        "createdAt",
        "views",
        "duration"
    ];

    if (!allowedSortFields.includes(sortBy)) {
        throw new ApiError(400, "Invalid sort field");
    }

    // userId validation
    if (userId && !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
        $match: {
            isPublished: true
        }
    });

    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        }
        )
    }

    pipeline.push({
        $sort: {
            [sortBy]: sortDirection     //sort in descending order[high to low]
        }
    },
        {
            $skip: (pageNumber - 1) * limitNumber  //skips the first 10, if page 2 (2-1)*10=10 are skipped
        },
        {
            $limit: limitNumber  //set the limit
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            avatar: 1,
                            fullName: 1,
                            username: 1,
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                owner: 1
            }
        }


    )

    const videos = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(
            new ApiResponse(200, videos, "Received videos successfully")
        )

})

export { getAllVideos }
