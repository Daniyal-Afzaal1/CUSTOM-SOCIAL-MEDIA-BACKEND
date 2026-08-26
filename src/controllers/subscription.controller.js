import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//toggle subscription
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId?.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    const Exists = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (Exists) {
        await Subscription.deleteOne({
            subscriber: req.user._id,
            channel: channelId
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, "unsubscribed successfully")
            )
    }

    const subscription = await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    if (!subscription) {
        throw new ApiError(400, "Error while subscribing")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, subscription, "Subscribed successfully")
        )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId?.trim() || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id")
    }

    // Make sure the logged-in user owns this channel
    if (!req.user._id.equals(channelId)) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$subscriber"
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribersList, "subscribers list sent successfully")
        )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!subscriberId?.trim() || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber id")
    }

    // Make sure the logged-in user owns this channel
    if (!req.user._id.equals(subscriberId)) {
        throw new ApiError(401, "Unauthorized Request")
    }

    const subscribedList = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$channel"
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(200, subscribedList, "subscribed channels list sent successfully")
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}  