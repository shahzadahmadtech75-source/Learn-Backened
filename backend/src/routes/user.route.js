import { Router } from "express";
import { loginUser,logOutUser, registerUser } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verify } from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

// user.route.js

router.route("/register").post(
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
    registerUser // <--- YOU WERE MISSING THIS LINE
)
router.route("/login").post(loginUser)

//secure route
router.route("/logout").post(verifyJWT , logOutUser)
export default router