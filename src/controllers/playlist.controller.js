import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlists.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { pipeline } from "stream"

//create playlist
const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name || !description) {
        throw new ApiError(400, "name or description cannnot be empty")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        videos: [],
        owner: req.user._id
    })

    if (!playlist) {
        throw new ApiError(400, "Error while creating playlist")
    }

    return res
        .status(201)
        .json(
            new ApiResponse(201, playlist, "Playlist created successfully")
        )

})

//get user playlists
const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid User ID");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if (playlists.length === 0) {
        throw new ApiError(404, "Not Found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlists, "fetched playlists successfully")
        )
})

//get playlist by id
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid or missing playlistId");
    }

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "channel"
                        }
                    },
                    {
                        $unwind: "$channel"
                    }
                ]
            }
        },
        {
            $addFields: {
                videoCount: { $size: "$video" },
                totalViews: { $sum: "$video.views" }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,

                username: "$video.channel.username",
                fullName: "$video.channel.fullName",
                avatar: "$video.channel.avatar",

                video: 1,

                videoCount: 1,
                totalViews: 1

            }
        }
    ])

    if (playlist.length === 0) {
        throw new ApiError(404, "Not Found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "playlist fetched successfully")
        )

})

//add video to playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorized Access")
    }

    for (let i = 0; i < playlist.videos.length; i++) {
        if (playlist.videos[i].equals(videoId)) {
            throw new ApiError(409, "video already exists")
        }
    }

    playlist.videos.push(videoId);

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "video added successfully")
        )
})

//remove video from playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorized Access")
    }

    let index = 0;
    let Exists = false;
    for (let i = 0; i < playlist.videos.length; i++) {
        if (playlist.videos[i].equals(videoId)) {
            index = i;
            Exists = true;
            break;
        }
    }

    if(!Exists){
        throw new ApiError(400, "Video doesnot exists")
    }

    playlist.videos.splice(index, 1);

    await playlist.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "video deleted successfully")
        )

})

//delete playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(404, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorized Access")
    }

    const response = await Playlist.findByIdAndDelete(playlistId);

    if (!response) {
        throw new ApiError(400, "Error while deleting")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "playlist Successfully deleted")
        )


})

//update playlist
const updatePlaylist = asyncHandler(async (req, res) => {   
    const { playlistId } = req.params
    const { name, description } = req.body
    
    if (!playlistId || !mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "Invalid playlist id")
    }
    if (!name?.trim() || !description?.trim()) {
        throw new ApiError(400, "Name or description can't be empty")
    }

    const userCheck = await Playlist.findById(playlistId);

    if(!userCheck.owner.equals(req.user._id)){
        throw new ApiError(401, "Unauthorized Access")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        $set : {
            name, 
            description
        }
    },
    {new : true}
    )

    if(!playlist){
        throw new ApiError(500, "Error while updating")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist updated successfully")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}