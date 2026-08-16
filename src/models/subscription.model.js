import mongoose from 'mongoose';
import { User } from './user.model';

const subscriptionSchema = new mongoose.Schema({
    subscriber : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }, //the one who will subscribe

    channel : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    } //the one who is subscribed

},{timestamps: true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema);