import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/likes.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

//Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!channelId.trim() || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const TotalviewsAndVideos = await Video.aggregate([
        {
            $match: {
                "owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null, // We use null because we don't want to group by any field

                totalVideos: { $sum: 1 }, //video document counter

                totalViews: { $sum: "$views" }
            }
        },
        {
            $project: {
                _id: 0,
                totalViews: 1,
                totalVideos: 1
            }
        }
    ])

    const ChannelStats = TotalviewsAndVideos[0] || {
        totalVideos: 0,
        totalViews: 0
    };

    const likes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $match: {
                "video.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    ChannelStats.totalLikes = likes[0]?.totalLikes || 0; //0 if channel has no likes

    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totalSubscribers"
        }
    ])

    ChannelStats.totalSubscribers = subscribersList[0].totalSubscribers || 0;

    return res
        .status(200)
        .json(
            new ApiResponse(200, ChannelStats, "Channel Stats sent successfully")
        )
})

//Get all the videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const {channelId} = req.params;

    if (!channelId.trim() || !mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const videos = await Video.find(
        {owner : channelId},
        {title : 1, thumbnail: 1, views: 1, duration: 1, createdAt: 1}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"fetched videos successfully")
    )

})

export {
    getChannelStats,
    getChannelVideos
}