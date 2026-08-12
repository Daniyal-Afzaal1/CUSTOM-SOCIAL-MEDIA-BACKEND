import { Router } from "express"; //if we write in {}, then we have to write the exact name exported
import { registerUser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(registerUser);

export default router; //with default in export, in import we can give it any name we want