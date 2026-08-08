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

export {app}