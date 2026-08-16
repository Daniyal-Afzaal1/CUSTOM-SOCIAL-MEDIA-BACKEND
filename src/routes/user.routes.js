import { Router } from "express"; //if we write in {}, then we have to write the exact name exported
import { LoginUser, LogoutUser, refreshAccessToken, registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post( //register
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
);

router.route("/login").post(LoginUser);  //login

router.route("/logout").post(verifyJWT, LogoutUser); //logout

router.route("/refresh-token").post(refreshAccessToken);

export default router; //with default in export, in import we can give it any name we want