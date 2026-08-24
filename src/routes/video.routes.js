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

router.route("get-all-videos").get(getAllVideos);

router.route("publish-video").post(verifyJWT,
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

router.route("get-video-by-id").get(getVideoById);

router.route("update-video").patch(verifyJWT,
    upload.single("thumbnail"),
    updateVideo
)

router.route("delete-video").delete(verifyJWT,deleteVideo);

router.route("toggle-Publish-Status").patch(verifyJWT,togglePublishStatus);

export default router;