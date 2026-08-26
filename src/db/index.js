import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async function (){
    try {
        const conncectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        )
        console.log(`\n MongoDB connected!!! DB HOST: ${conncectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("ERROR in connection: ", error);
        process.exit(1)
    }
}

export default connectDB; 