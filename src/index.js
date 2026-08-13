// require('dotenv').config({path: './env'})
// import dotenv from "dotenv"          i commented it as there is no more need of it as imported modules are loaded first before loading .env into process.env so i load them in dev command before loading imported modules as i was having error making cloudinary config variables undefined
import connectDB from "./db/index.js";
import { app } from "./app.js";

// dotenv.config({      // Load environment variables from the .env file into process.env
//     path: './.env'
// })

const PORT = process.env.PORT || 8000;

connectDB()  //b/c every async method declared with async returns a promise so we will handle the result of promise in .then and .catch
.then(()=>{
    const server = app.listen(PORT , ()=>{          // app.listen() starts the HTTP server and returns the server instance
        console.log(`App is listening on PORT ${PORT}`);        
    })

    server.on("error", (err) => {          //if any error occurs like port occupied
        console.error("Server Error : ", err);
        process.exit(1);
    })
})
.catch( (err) => {
    console.error("MongoDB Connection Failed:", err);
    process.exit(1);
});










/*

import express from "express";
const app = express();

( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error", (error)=> {
            console.log("ERROR: ", error);
            throw error
        }); //listening on error after conncection of db

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT} `);
            
        })
    }catch(error){
        console.error("ERROR: ", error)
        throw error
    }
})()

*/