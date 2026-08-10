import mongoose, { Mongoose } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoModel = new mongoose.Schema({
    videoFile:{
        type: String,      //cloudinary url
        required: true
    },
    thumbnail:{
        type: String,      //cloudinary url
        required: true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    duration:{
        type: Number,
        required: true
    },
    views:{
        type: Number,
        default: 0   
    },
    isPublished:{                  //is publicly available or not
        type: Boolean,      
        default: true           
    }    
},{timestamps: true});

videoModel.plugin(mongooseAggregatePaginate); //before export so model can have the plugin abilities to perform aggregation pipeline operations        

export const Video = mongoose.model("Video", videoModel);