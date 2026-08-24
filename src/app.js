import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({                          //Using cors middleware
    origin: process.env.CORS_ORIGIN,
    credentials: true                   // Allow cookies in cross-origin requests
}))

app.use(express.json({limit: "16kb"})) // Parse JSON request bodies and limit them to 16KB
app.use(express.urlencoded({extended : true, limit: "16kb"}))  // Parse nested form data; limit body to 16KB
app.use(express.static("public"))  // Serve static files from the public folder, if frontend requests it gives
app.use(cookieParser()) // Parse cookies and make them available through req.cookies

//routes : we write the routes after cuz controllers may need the middle wares processed data like json to work with
import userRouter from "./routes/user.routes.js"
app.use("/api/v1/users",userRouter);            //base route for userRouters

//video router
import videoRouter from "./routes/video.routes.js"
app.use("api/v1/video",videoRouter)


export {app}