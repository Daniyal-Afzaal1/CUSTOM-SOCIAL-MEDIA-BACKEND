import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllVideos);

router.route("/publish").post(verifyJWT,
    upload.fields([
        {
            name: thumbnail,
            maxCount: 1
        },
        {
            name : videoFile,
            maxCount : 1
        }
    ]),
    publishAVideo
);

router.route("/get/:videoId").get(getVideoById);

router.route("/update/:videoId").patch(verifyJWT,
    upload.single("thumbnail"),
    updateVideo
)

router.route("/delete/:videoId").delete(verifyJWT,deleteVideo);

router.route("/toggle/Publish-status/:videoId").patch(verifyJWT,togglePublishStatus);

export default router;