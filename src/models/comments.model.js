import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const commentsSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
}, { timestamps: true })

commentsSchema.plugin(mongooseAggregatePaginate); //before export so model can have the plugin abilities to perform aggregation pipeline operations        

export const Comment = mongoose.model("Comment", commentsSchema); 