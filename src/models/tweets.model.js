import mongoose, {Schema} from "mongoose";

const tweetsSchema = new mongoose.Schema({
    owner: {
        type : Schema.Types.ObjectId,
        ref : "User",
        required : true
    },
    content : {
        type : String,
        required : true
    }
},{timestamps : true})

export const Tweet = mongoose.model("Tweet",tweetsSchema); 