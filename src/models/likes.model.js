import mongoose from "mongoose";

const likesSchema = new mongoose.Schema({
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    likedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    tweet: {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Tweet"
        },
}, { timestamps: true });

// ---------------------------------------------------------
// ADDED: Prevent the same user from liking the same video
// more than once.
//
// likedBy + video must be unique together.
// Example:
// User A + Video X  -> allowed
// User A + Video X  -> NOT allowed
// User B + Video X  -> allowed
//
// partialFilterExpression means:
// "Apply this unique rule ONLY to documents that
// actually have a video field."
// This is necessary because the same Like collection
// also contains comment likes and tweet likes.
// ---------------------------------------------------------
likesSchema.index(
    { likedBy: 1, video: 1 },
    {
        unique: true,
        partialFilterExpression: {
            video: { $exists: true }
        }
    }
);


// ---------------------------------------------------------
// ADDED: Prevent the same user from liking the same comment
// more than once.
//
// likedBy + comment must be unique together.
//
// The partial filter makes this rule apply ONLY to
// comment likes, not video or tweet likes.
// ---------------------------------------------------------
likesSchema.index(
    { likedBy: 1, comment: 1 },
    {
        unique: true,
        partialFilterExpression: {
            comment: { $exists: true }
        }
    }
);


// ---------------------------------------------------------
// ADDED: Prevent the same user from liking the same tweet
// more than once.
//
// likedBy + tweet must be unique together.
//
// The partial filter makes this rule apply ONLY to
// tweet likes.
// ---------------------------------------------------------
likesSchema.index(
    { likedBy: 1, tweet: 1 },
    {
        unique: true,
        partialFilterExpression: {
            tweet: { $exists: true }
        }
    }
);

export const Like = mongoose.model("Like", likesSchema); 