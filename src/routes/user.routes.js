import { Router } from "express"; //if we write in {}, then we have to write the exact name exported
import {
    LoginUser,
    LogoutUser,
    refreshAccessToken,
    registerUser,
    change_current_password,
    getCurrentUser,
    update_account_details,
    update_avatar,
    update_coverImage,
    get_user_channel_profile,
    get_watch_history
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post( //register
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(LoginUser);  //login

router.route("/logout").post(verifyJWT, LogoutUser); //logout

router.route("/refresh-token").post(refreshAccessToken); //refreshes access token

router.route("/change-password").patch(verifyJWT, change_current_password);

router.route("/current-user").get(verifyJWT, getCurrentUser);

router.route("/update-account").patch(verifyJWT, update_account_details);

router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), update_avatar);

router.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), update_coverImage);

router.route("/c/:username").get(verifyJWT, get_user_channel_profile); //get user channel profile

router.route("/history").get(verifyJWT, get_watch_history); //get watch history

export default router; //with default in export, in import we can give it any name we want 