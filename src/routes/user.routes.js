import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateDetails,
    UpdateAvatar
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middelware.js";
import { verifyJWT } from "../middlewares/auth.milleware.js";

const router = Router();

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
    registerUser
)

router.route("/login").post(loginUser)


//secure route
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changePassword)
router.route("/get-current-user").post(verifyJWT,getCurrentUser)
router.route("/update-details").post(verifyJWT,updateDetails)

router.route("/update-avatar").post(verifyJWT,upload.single("avatar"),UpdateAvatar)

//  http://localhost:8000/api/v1/users/register

export default router;