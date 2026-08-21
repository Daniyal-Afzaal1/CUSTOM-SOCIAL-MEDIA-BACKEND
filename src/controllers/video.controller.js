import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, delete_from_cloudinary } from "../utils/cloudinary.js"
import fs from "fs"

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

//get video, upload to cloudinary, create video
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description, isPublished, } = req.body


    const thumbnail_local_path = req.files?.thumbnail?.[0]?.path;
    const videofile_local_path = req.files?.videoFile?.[0]?.path;

    if (!title || !description) {
        if (videofile_local_path) {
            fs.unlinkSync(videofile_local_path)
        }
        if (thumbnail_local_path) {
            fs.unlinkSync(thumbnail_local_path)
        }
        throw new ApiError(401, "title or description cant be empty");
    }

    if (!thumbnail_local_path || !videofile_local_path) {
        if (videofile_local_path) {
            fs.unlinkSync(videofile_local_path)
        }
        if (thumbnail_local_path) {
            fs.unlinkSync(thumbnail_local_path)
        }
        throw new ApiError(401, "thumbnail or videofile cant be empty");
    }

    const VideoFile = await uploadOnCloudinary(videofile_local_path);

    if (!VideoFile) {
        fs.unlinkSync(videofile_local_path);
        fs.unlinkSync(thumbnail_local_path);
        throw new ApiError(400, " Error uploading the video file");
    }

    const Thumbnail = await uploadOnCloudinary(thumbnail_local_path);

    if (!Thumbnail) {
        fs.unlinkSync(thumbnail_local_path);
        await delete_from_cloudinary(VideoFile.public_id);
        throw new ApiError(400, " Error uploading the thumbnail");
    }

    const video = await Video.create({
        videoFile: VideoFile?.secure_url,
        videoFile_publicID: VideoFile?.public_id,
        thumbnail: Thumbnail?.secure_url,
        thumbnail_publicID: Thumbnail?.public_id,
        owner: req.user._id,
        title,
        description,
        isPublished,
        duration: VideoFile?.duration
    });

    if (!video) {
        await delete_from_cloudinary(VideoFile.public_id);
        await delete_from_cloudinary(Thumbnail?.public_id)
        throw new ApiError(500, "Error while publishing video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video published successfully")
        )
})

//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    if (!video) {
        throw ApiError(400, "file not exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video send successfully")
        )

})

//update video details like title, description, thumbnail
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body;

    if (!title) {
        throw new ApiError(400, "error receiving title")
    }
    if (!description) {
        throw new ApiError(400, "error receiving description")
    }

    const thumbnail_local_path = req.file?.path;

    if (!thumbnail_local_path) {
        throw new ApiError(400, "error receiving the thumbnail")
    }

    const thumbnail_response = await uploadOnCloudinary(thumbnail_local_path);

    if (!thumbnail_response) {
        fs.unlinkSync(thumbnail_local_path);
        throw new ApiError(500, "Error uploading the thumbail on cloudinary")
    }

    const old_video_details = await Video.findById(videoId);

    if (!old_video_details) {
        fs.unlinkSync(thumbnail_local_path);
        throw new ApiError(500, "Error while updating");
    }

    const video = await Video.findByIdAndUpdate(videoId, {
        $set: {
            title: title,
            description: description,
            thumbnail: thumbnail_response.secure_url,
            thumbnail_publicID: thumbnail_response.public_id
        }
    },
        { new: true }
    )

    if (video) {
        await delete_from_cloudinary(old_video_details.thumbnail_publicID)
    }
    else {
        throw new ApiError(500, "Error while updating");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "fields updated successfully")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findByIdAndDelete(videoId);

    if (!video) {
        throw new ApiError(500, "Error while deleting")
    }

    const video_response = await delete_from_cloudinary(video.videoFile_publicID);

    if (!video_response) {
        console.log("Video needs manual deletion:", video.videoFile_publicID); // we can also make a seperate mongoDB collection to store the documents of failed deletion so they can be done afterwards
        throw new ApiError(500, "Error while deleting video, ${video_publicID}")
    }

    const thumbnail_response = await delete_from_cloudinary(video.thumbnail_publicID);

    if (!thumbnail_response) {
        console.log("thumbnail needs manual deletion:", video.thumbnail_publicID);
        throw new ApiError(500, "Error while deleting thumbnail");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "video deleted successfully")
        )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { isPublished } = req.body;

    const video = await findByIdAndUpdate(videoId,
        {
            $set: {
                isPublished: isPublished
            }
        },
        { new: true }
    )

    if (!video) {
        throw new ApiError(500, "Error while updating published status")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "published status changed successfullt")
        )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
