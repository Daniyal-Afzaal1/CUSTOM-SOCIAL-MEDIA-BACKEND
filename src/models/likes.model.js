import mongoose from "mongoose";

const likesSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tweet: {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Tweet",
            required : true
        },
}, { timestamps: true })

export const Like = mongoose.model("Like", likesSchema);