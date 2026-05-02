import { Router } from "express";
import { getCurrentUser, 
    loginUser, 
    logOutUser,
    registerUser, 
    updateAccountDetails,
    updateUserAvatar, 
    updateUserCoverImg } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import verify from "jsonwebtoken";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
import { changeCurrentPassword } from "../controllers/user.controller.js";
import { getUserChannelProfile } from "../controllers/user.controller.js";
import { getWatchHistory } from "../controllers/user.controller.js";
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
router.route("/logout").post(verifyJWT, logOutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImg)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watch-history").get(verifyJWT, getWatchHistory)
export default router