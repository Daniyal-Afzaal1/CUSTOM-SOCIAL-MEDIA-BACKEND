import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js"

const router = Router();

router.route("/toggle/:channelId").post(verifyJWT,toggleSubscription);

router.route("/get/subscribers/:channelId").get(verifyJWT,getUserChannelSubscribers);

router.route("/get/subscribed/:subscriberId").get(verifyJWT,getSubscribedChannels)

export default router;  